/**
 * angular-schema-form-nwp-file-upload - Upload file type for Angular Schema Form
 * @version v0.1.5
 * @link https://github.com/saburab/angular-schema-form-nwp-file-upload
 * @license MIT
 */
'use strict';

angular
    .module('schemaForm')
    .config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider', 'sfBuilderProvider',
       function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider, sfBuilderProvider) {
          var defaultPatternMsg  = 'Wrong file type. Allowed types are ',
              defaultMaxSizeMsg1 = 'This file is too large. Maximum size allowed is ',
              defaultMaxSizeMsg2 = 'Current file size:',
              defaultMinItemsMsg = 'You have to upload at least one file',
              defaultMaxItemsMsg = 'You can\'t upload more than one file.';

          var nwpSinglefileUpload = function (name, schema, options) {
             if (schema.type === 'array' && schema.format === 'singlefile') {
                if (schema.pattern && schema.pattern.mimeType && !schema.pattern.validationMessage) {
                   schema.pattern.validationMessage = defaultPatternMsg;
                }
                if (schema.maxSize && schema.maxSize.maximum && !schema.maxSize.validationMessage) {
                   schema.maxSize.validationMessage  = defaultMaxSizeMsg1;
                   schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
                }
                if (schema.minItems && schema.minItems.minimum && !schema.minItems.validationMessage) {
                   schema.minItems.validationMessage = defaultMinItemsMsg;
                }
                if (schema.maxItems && schema.maxItems.maximum && !schema.maxItems.validationMessage) {
                   schema.maxItems.validationMessage = defaultMaxItemsMsg;
                }

                var f                                                  = schemaFormProvider.stdFormObj(name, schema, options);
                f.key                                                  = options.path;
                f.type                                                 = 'nwpFileUpload';
                options.lookup[sfPathProvider.stringify(options.path)] = f;
                return f;
             }
          };

          schemaFormProvider.defaults.array.unshift(nwpSinglefileUpload);

          var nwpMultifileUpload = function (name, schema, options) {
             if (schema.type === 'array' && schema.format === 'multifile') {
                if (schema.pattern && schema.pattern.mimeType && !schema.pattern.validationMessage) {
                   schema.pattern.validationMessage = defaultPatternMsg;
                }
                if (schema.maxSize && schema.maxSize.maximum && !schema.maxSize.validationMessage) {
                   schema.maxSize.validationMessage  = defaultMaxSizeMsg1;
                   schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
                }
                if (schema.minItems && schema.minItems.minimum && !schema.minItems.validationMessage) {
                   schema.minItems.validationMessage = defaultMinItemsMsg;
                }
                if (schema.maxItems && schema.maxItems.maximum && !schema.maxItems.validationMessage) {
                   schema.maxItems.validationMessage = defaultMaxItemsMsg;
                }

                var f                                                  = schemaFormProvider.stdFormObj(name, schema, options);
                f.key                                                  = options.path;
                f.type                                                 = 'nwpFileUpload';
                options.lookup[sfPathProvider.stringify(options.path)] = f;
                return f;
             }
          };

          schemaFormProvider.defaults.array.unshift(nwpMultifileUpload);

          var ngModelOptions = sfBuilderProvider.builders.ngModelOptions;
          var ngModel = sfBuilderProvider.builders.ngModel;
          var sfField = sfBuilderProvider.builders.sfField;
          var condition = sfBuilderProvider.builders.condition;          
		  var complexValidation = sfBuilderProvider.builders.complexValidation;
          var defaults = [sfField, ngModel, ngModelOptions, condition, complexValidation];

          schemaFormDecoratorsProvider.defineAddOn(
              'bootstrapDecorator',
              'nwpFileUpload',
              'directives/decorators/bootstrap/nwp-file/nwp-file.html',
              defaults
          );

       }
    ]);

angular
    .module('ngSchemaFormFile', [
       'ngFileUpload',
       'ngMessages'
    ])
    .controller('ngSchemaFileController',['$scope', function($scope) {
       $scope.initInternalModel = function(model){
          if(model && model.type && model.name) {			  
             $scope.picFile = {};
             $scope.picFile.result = model;
             $scope.picFile.name = model.name;
             $scope.picFile.progress = 100;
             $scope.picFile.size = 0;
             $scope.picFile.type = model.type;
          }
       };
    }])
    .directive('ngSchemaFile', ['Upload', '$timeout', '$q', function (Upload, $timeout, $q) {
       return {
          restrict: 'A',
          scope:    true,
          controller: 'ngSchemaFileController',
          require:  'ngModel',
          link:     function (scope, element, attrs, ngModel) {
             scope.url = scope.form && scope.form.endpoint;
             scope.isSinglefileUpload = scope.form && scope.form.schema && scope.form.schema.format === 'singlefile';

             scope.selectFile  = function (file) {
                if(!file) 
					return;
                scope.picFile = file;
				
				if(scope.$$prevSibling && scope.$$prevSibling.form && scope.$$prevSibling.form.key.join('.').startsWith(scope.form.key.join('.'))) {
					
					toggleValidationFileMetadataComponents(true);
										
					var expr = "evalExpr('"+scope.fieldToWatch+"',{ model: model, 'arrayIndex': 0, 'modelValue': ''})";
					scope.removeWatchForRequireMetadata = scope.$watch(expr, function watchIt(value) {						
						if(!value) {
							scope.$broadcast('schemaForm.error.' + scope.form.key.join('.'), 'requireMetadata');
						} else {
							scope.$broadcast('schemaForm.error.' + scope.form.key.join('.'), 'requireMetadata', true);
						}
					});
				}
             };
             scope.selectFiles = function (files) {
                scope.picFiles = files;
             };

             scope.uploadFile = function (file) {
                file && doUpload(file);
             };

             scope.uploadFiles = function (files) {
                files.length && angular.forEach(files, function (file) {
                   doUpload(file);
                });
             };

             // kelin: handler for the remove action.
             // TODO: Need to communicate with server for deletion if the file is already uploaded.
             scope.removeFile = function () {
                if (scope.isSinglefileUpload) {
                   				   
				   if(scope.picFile && scope.picFile.result) {  //Already uploaded file, remove the whole file object including file metadatas
						ngModel.$setViewValue();
						ngModel.$commitViewValue();
				   }
				   
				   scope.picFile = null;
				   
				   if(scope.removeWatchForRequireMetadata) {
						scope.removeWatchForRequireMetadata();
						delete scope.removeWatchForRequireMetadata;
						scope.$broadcast('schemaForm.error.' + scope.form.key.join('.'), 'requireMetadata', true);
						toggleValidationFileMetadataComponents(false);
				   }
				   
                } else {

                }
             };

             function doUpload(file) {
                if (file && !file.$error && scope.url) {
                   file.upload = Upload.upload({
                      url:  scope.url,
                      file: file
                   });

                   file.upload.then(function (response) {
                      $timeout(function () {
                         file.result = response.data;
                      });
                      ngModel.$setViewValue(response.data);
                      ngModel.$commitViewValue();
                   }, function (response) {
                      if (response.status > 0) {
                         scope.errorMsg = response.status + ': ' + response.data;
                      }
                   });

                   file.upload.progress(function (evt) {
                      file.progress = Math.min(100, parseInt(100.0 *
                          evt.loaded / evt.total));
                   });
                }
             }

             scope.validateField = function () {				
                if (scope.uploadForm.file && scope.uploadForm.file.$valid && scope.picFile && !scope.picFile.$error) {
                   //console.log('singlefile-form is invalid');
                } else if (scope.uploadForm.files && scope.uploadForm.files.$valid && scope.picFiles && !scope.picFiles.$error) {
                   //console.log('multifile-form is  invalid');
                } else {
                   //console.log('single- and multifile-form are valid');
                }
             };
             scope.submit        = function () {
                if (scope.uploadForm.file && scope.uploadForm.file.$valid && scope.picFile && !scope.picFile.$error) {
                   scope.uploadFile(scope.picFile);
                } else if (scope.uploadForm.files && scope.uploadForm.files.$valid && scope.picFiles && !scope.picFiles.$error) {
                   scope.uploadFiles(scope.picFiles);
                }
             };
             scope.$on('schemaFormValidate', scope.validateField);
             scope.$on('schemaFormFileUploadSubmit', scope.submit);
			 
			 function toggleValidationFileMetadataComponents(required) {
				var fieldToWatch = ""
				var next = scope.$$prevSibling;
				while(next && next.form && next.form.key && next.form.key.join('.').startsWith(scope.form.key.join('.'))) {
					next.form.required = required;					
					next.$broadcast("schemaFormValidate");
					fieldToWatch +="model."+next.form.key.join('.')+"&&";
					
					next = next.$$prevSibling;						
				}
				if(fieldToWatch.length>0) {
					fieldToWatch = fieldToWatch.substring(0,fieldToWatch.length-2);
				}
				scope.fieldToWatch = fieldToWatch;
			 }
          }
       };
    }]);

angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/nwp-file/nwp-file.html","<ng-form class=\"file-upload mb-lg\" ng-schema-file schema-validate=\"form\" sf-field-model=\"replaceAll\" ng-init=\"initInternalModel($$value$$)\" ng-model=\"$$value$$\" name=\"uploadForm\">\r\n   <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\r\n      {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\r\n   </label>\r\n\r\n   <div ng-show=\"picFile\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\r\n      <div ng-include=\"\'uploadProcess.html\'\" class=\"mb\"></div>\r\n	  <span class=\"help-block\" sf-message=\"form.description\"></span>\r\n   </div>\r\n\r\n   <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group\">\r\n      <li class=\"list-group-item\" ng-repeat=\"picFile in picFiles\">\r\n         <div ng-include=\"\'uploadProcess.html\'\"></div>\r\n      </li>\r\n   </ul>\r\n\r\n   <div ng-show=\"(isSinglefileUpload && !picFile) || (!isSinglefileUpload && (!picFiles || !picFiles.length))\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\r\n      <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\r\n      <div ng-if=\"isSinglefileUpload\" ng-include=\"\'singleFileUpload.html\'\"></div>\r\n      <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'multiFileUpload.html\'\"></div>\r\n      <!--<div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>-->\r\n      <span class=\"help-block\" sf-message=\"form.description\"></span>\r\n   </div>\r\n</ng-form>\r\n\r\n<script type=\'text/ng-template\' id=\"uploadProcess.html\">\r\n   <div class=\"row mb\">\r\n      <div class=\"col-sm-4 mb-sm\">\r\n         <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\r\n            \'modules.upload.field.preview\' | translate }}</label>\r\n         <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\r\n         <div class=\"img-placeholder\"\r\n              ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">No preview\r\n            available\r\n         </div>\r\n      </div>\r\n      <div class=\"col-sm-4 mb-sm\">\r\n         <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\r\n            \'modules.upload.field.filename\' | translate }}</label>\r\n         <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\r\n      </div>\r\n      <div class=\"col-sm-4 mb-sm\">\r\n         <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\r\n            \'modules.upload.field.progress\' | translate }}</label>\r\n         <div class=\"progress\">\r\n            <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\r\n                 ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\r\n                 ng-style=\"{width: picFile.progress + \'%\'}\">\r\n               {{ picFile.progress }} %\r\n            </div>\r\n         </div>\r\n         <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile)\"\r\n                 ng-disabled=\"ngModel.$error.requireMetadata||!picFile || picFile.result || picFile.$error\">{{ !picFile.result ?  \"buttons.upload\" : \"buttons.uploaded\" | translate }}\r\n         </button>\r\n         <button class=\"btn btn-danger btn-sm\" type=\"button\" ng-click=\"removeFile(picFile)\"\r\n                 ng-disabled=\"!picFile || picFile.$error\">{{ \"buttons.remove\" | translate }}\r\n         </button>\r\n      </div>\r\n   </div>\r\n   <div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\r\n      <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong>. ({{ form.schema[picFile.$error].validationMessage2 | translate }} <strong>{{picFile.size / 1000000|number:1}}MB</strong>)</div>\r\n      <div class=\"text-danger errorMsg\" ng-message=\"pattern\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\r\n      <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\r\n      <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\r\n      <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{errorMsg}}</div>\r\n   </div>\r\n</script>\r\n\r\n<script type=\'text/ng-template\' id=\"singleFileUpload.html\">\r\n   <div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\r\n        ng-model=\"picFile\" name=\"file\"\r\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\r\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\r\n        ng-required=\"form.required\"\r\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\r\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\r\n      <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\r\n   </div>\r\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\r\n\r\n   <button ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\r\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\r\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\r\n           ng-required=\"form.required\"\r\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\r\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\r\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\r\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\r\n      {{ \"buttons.add\" | translate }}\r\n   </button>\r\n</script>\r\n\r\n<script type=\'text/ng-template\' id=\"multiFileUpload.html\">\r\n   <div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\r\n        ng-model=\"picFiles\" name=\"files\"\r\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\r\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\r\n        ng-required=\"form.required\"\r\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\r\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\r\n      <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\r\n   </div>\r\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\r\n\r\n   <button ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\r\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\r\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\r\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\r\n           ng-required=\"form.required\"\r\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\r\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\r\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\r\n      {{ \"buttons.add\" | translate }}\r\n   </button>\r\n</script>\r\n");}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OEVDcE9BIiwiZmlsZSI6InNjaGVtYS1mb3JtLWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyXHJcbiAgICAubW9kdWxlKCdzY2hlbWFGb3JtJylcclxuICAgIC5jb25maWcoWydzY2hlbWFGb3JtUHJvdmlkZXInLCAnc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlcicsICdzZlBhdGhQcm92aWRlcicsICdzZkJ1aWxkZXJQcm92aWRlcicsXHJcbiAgICAgICBmdW5jdGlvbiAoc2NoZW1hRm9ybVByb3ZpZGVyLCBzY2hlbWFGb3JtRGVjb3JhdG9yc1Byb3ZpZGVyLCBzZlBhdGhQcm92aWRlciwgc2ZCdWlsZGVyUHJvdmlkZXIpIHtcclxuICAgICAgICAgIHZhciBkZWZhdWx0UGF0dGVybk1zZyAgPSAnV3JvbmcgZmlsZSB0eXBlLiBBbGxvd2VkIHR5cGVzIGFyZSAnLFxyXG4gICAgICAgICAgICAgIGRlZmF1bHRNYXhTaXplTXNnMSA9ICdUaGlzIGZpbGUgaXMgdG9vIGxhcmdlLiBNYXhpbXVtIHNpemUgYWxsb3dlZCBpcyAnLFxyXG4gICAgICAgICAgICAgIGRlZmF1bHRNYXhTaXplTXNnMiA9ICdDdXJyZW50IGZpbGUgc2l6ZTonLFxyXG4gICAgICAgICAgICAgIGRlZmF1bHRNaW5JdGVtc01zZyA9ICdZb3UgaGF2ZSB0byB1cGxvYWQgYXQgbGVhc3Qgb25lIGZpbGUnLFxyXG4gICAgICAgICAgICAgIGRlZmF1bHRNYXhJdGVtc01zZyA9ICdZb3UgY2FuXFwndCB1cGxvYWQgbW9yZSB0aGFuIG9uZSBmaWxlLic7XHJcblxyXG4gICAgICAgICAgdmFyIG53cFNpbmdsZWZpbGVVcGxvYWQgPSBmdW5jdGlvbiAobmFtZSwgc2NoZW1hLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdhcnJheScgJiYgc2NoZW1hLmZvcm1hdCA9PT0gJ3NpbmdsZWZpbGUnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLnBhdHRlcm4gJiYgc2NoZW1hLnBhdHRlcm4ubWltZVR5cGUgJiYgIXNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEucGF0dGVybi52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRQYXR0ZXJuTXNnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5tYXhTaXplICYmIHNjaGVtYS5tYXhTaXplLm1heGltdW0gJiYgIXNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSAgPSBkZWZhdWx0TWF4U2l6ZU1zZzE7XHJcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZTIgPSBkZWZhdWx0TWF4U2l6ZU1zZzI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmIHNjaGVtYS5taW5JdGVtcy5taW5pbXVtICYmICFzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5taW5JdGVtcy52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNaW5JdGVtc01zZztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgc2NoZW1hLm1heEl0ZW1zLm1heGltdW0gJiYgIXNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heEl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdE1heEl0ZW1zTXNnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHNjaGVtYUZvcm1Qcm92aWRlci5zdGRGb3JtT2JqKG5hbWUsIHNjaGVtYSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBmLmtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBvcHRpb25zLnBhdGg7XHJcbiAgICAgICAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmxvb2t1cFtzZlBhdGhQcm92aWRlci5zdHJpbmdpZnkob3B0aW9ucy5wYXRoKV0gPSBmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGY7XHJcbiAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjaGVtYUZvcm1Qcm92aWRlci5kZWZhdWx0cy5hcnJheS51bnNoaWZ0KG53cFNpbmdsZWZpbGVVcGxvYWQpO1xyXG5cclxuICAgICAgICAgIHZhciBud3BNdWx0aWZpbGVVcGxvYWQgPSBmdW5jdGlvbiAobmFtZSwgc2NoZW1hLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdhcnJheScgJiYgc2NoZW1hLmZvcm1hdCA9PT0gJ211bHRpZmlsZScpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdFBhdHRlcm5Nc2c7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heFNpemUgJiYgc2NoZW1hLm1heFNpemUubWF4aW11bSAmJiAhc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlICA9IGRlZmF1bHRNYXhTaXplTXNnMTtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlMiA9IGRlZmF1bHRNYXhTaXplTXNnMjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWluSXRlbXMgJiYgc2NoZW1hLm1pbkl0ZW1zLm1pbmltdW0gJiYgIXNjaGVtYS5taW5JdGVtcy52YWxpZGF0aW9uTWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdE1pbkl0ZW1zTXNnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5tYXhJdGVtcyAmJiBzY2hlbWEubWF4SXRlbXMubWF4aW11bSAmJiAhc2NoZW1hLm1heEl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4SXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWF4SXRlbXNNc2c7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gc2NoZW1hRm9ybVByb3ZpZGVyLnN0ZEZvcm1PYmoobmFtZSwgc2NoZW1hLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcclxuICAgICAgICAgICAgICAgIGYudHlwZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9ICdud3BGaWxlVXBsb2FkJztcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMubG9va3VwW3NmUGF0aFByb3ZpZGVyLnN0cmluZ2lmeShvcHRpb25zLnBhdGgpXSA9IGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcclxuICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwTXVsdGlmaWxlVXBsb2FkKTtcclxuXHJcbiAgICAgICAgICB2YXIgbmdNb2RlbE9wdGlvbnMgPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5uZ01vZGVsT3B0aW9ucztcclxuICAgICAgICAgIHZhciBuZ01vZGVsID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMubmdNb2RlbDtcclxuICAgICAgICAgIHZhciBzZkZpZWxkID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMuc2ZGaWVsZDtcclxuICAgICAgICAgIHZhciBjb25kaXRpb24gPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5jb25kaXRpb247ICAgICAgICAgIFxyXG5cdFx0ICB2YXIgY29tcGxleFZhbGlkYXRpb24gPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5jb21wbGV4VmFsaWRhdGlvbjtcclxuICAgICAgICAgIHZhciBkZWZhdWx0cyA9IFtzZkZpZWxkLCBuZ01vZGVsLCBuZ01vZGVsT3B0aW9ucywgY29uZGl0aW9uLCBjb21wbGV4VmFsaWRhdGlvbl07XHJcblxyXG4gICAgICAgICAgc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlci5kZWZpbmVBZGRPbihcclxuICAgICAgICAgICAgICAnYm9vdHN0cmFwRGVjb3JhdG9yJyxcclxuICAgICAgICAgICAgICAnbndwRmlsZVVwbG9hZCcsXHJcbiAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMvZGVjb3JhdG9ycy9ib290c3RyYXAvbndwLWZpbGUvbndwLWZpbGUuaHRtbCcsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdHNcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgfVxyXG4gICAgXSk7XHJcblxyXG5hbmd1bGFyXHJcbiAgICAubW9kdWxlKCduZ1NjaGVtYUZvcm1GaWxlJywgW1xyXG4gICAgICAgJ25nRmlsZVVwbG9hZCcsXHJcbiAgICAgICAnbmdNZXNzYWdlcydcclxuICAgIF0pXHJcbiAgICAuY29udHJvbGxlcignbmdTY2hlbWFGaWxlQ29udHJvbGxlcicsWyckc2NvcGUnLCBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgICRzY29wZS5pbml0SW50ZXJuYWxNb2RlbCA9IGZ1bmN0aW9uKG1vZGVsKXtcclxuICAgICAgICAgIGlmKG1vZGVsICYmIG1vZGVsLnR5cGUgJiYgbW9kZWwubmFtZSkge1x0XHRcdCAgXHJcbiAgICAgICAgICAgICAkc2NvcGUucGljRmlsZSA9IHt9O1xyXG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUucmVzdWx0ID0gbW9kZWw7XHJcbiAgICAgICAgICAgICAkc2NvcGUucGljRmlsZS5uYW1lID0gbW9kZWwubmFtZTtcclxuICAgICAgICAgICAgICRzY29wZS5waWNGaWxlLnByb2dyZXNzID0gMTAwO1xyXG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUuc2l6ZSA9IDA7XHJcbiAgICAgICAgICAgICAkc2NvcGUucGljRmlsZS50eXBlID0gbW9kZWwudHlwZTtcclxuICAgICAgICAgIH1cclxuICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ25nU2NoZW1hRmlsZScsIFsnVXBsb2FkJywgJyR0aW1lb3V0JywgJyRxJywgZnVuY3Rpb24gKFVwbG9hZCwgJHRpbWVvdXQsICRxKSB7XHJcbiAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgIHNjb3BlOiAgICB0cnVlLFxyXG4gICAgICAgICAgY29udHJvbGxlcjogJ25nU2NoZW1hRmlsZUNvbnRyb2xsZXInLFxyXG4gICAgICAgICAgcmVxdWlyZTogICduZ01vZGVsJyxcclxuICAgICAgICAgIGxpbms6ICAgICBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XHJcbiAgICAgICAgICAgICBzY29wZS51cmwgPSBzY29wZS5mb3JtICYmIHNjb3BlLmZvcm0uZW5kcG9pbnQ7XHJcbiAgICAgICAgICAgICBzY29wZS5pc1NpbmdsZWZpbGVVcGxvYWQgPSBzY29wZS5mb3JtICYmIHNjb3BlLmZvcm0uc2NoZW1hICYmIHNjb3BlLmZvcm0uc2NoZW1hLmZvcm1hdCA9PT0gJ3NpbmdsZWZpbGUnO1xyXG5cclxuICAgICAgICAgICAgIHNjb3BlLnNlbGVjdEZpbGUgID0gZnVuY3Rpb24gKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGlmKCFmaWxlKSBcclxuXHRcdFx0XHRcdHJldHVybjtcclxuICAgICAgICAgICAgICAgIHNjb3BlLnBpY0ZpbGUgPSBmaWxlO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmKHNjb3BlLiQkcHJldlNpYmxpbmcgJiYgc2NvcGUuJCRwcmV2U2libGluZy5mb3JtICYmIHNjb3BlLiQkcHJldlNpYmxpbmcuZm9ybS5rZXkuam9pbignLicpLnN0YXJ0c1dpdGgoc2NvcGUuZm9ybS5rZXkuam9pbignLicpKSkge1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyh0cnVlKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdHZhciBleHByID0gXCJldmFsRXhwcignXCIrc2NvcGUuZmllbGRUb1dhdGNoK1wiJyx7IG1vZGVsOiBtb2RlbCwgJ2FycmF5SW5kZXgnOiAwLCAnbW9kZWxWYWx1ZSc6ICcnfSlcIjtcclxuXHRcdFx0XHRcdHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhID0gc2NvcGUuJHdhdGNoKGV4cHIsIGZ1bmN0aW9uIHdhdGNoSXQodmFsdWUpIHtcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0aWYoIXZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdFx0c2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZm9ybS5rZXkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJyk7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0c2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZm9ybS5rZXkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgdHJ1ZSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICBzY29wZS5zZWxlY3RGaWxlcyA9IGZ1bmN0aW9uIChmaWxlcykge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUucGljRmlsZXMgPSBmaWxlcztcclxuICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgc2NvcGUudXBsb2FkRmlsZSA9IGZ1bmN0aW9uIChmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlICYmIGRvVXBsb2FkKGZpbGUpO1xyXG4gICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICBzY29wZS51cGxvYWRGaWxlcyA9IGZ1bmN0aW9uIChmaWxlcykge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMubGVuZ3RoICYmIGFuZ3VsYXIuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24gKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgIGRvVXBsb2FkKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgIC8vIGtlbGluOiBoYW5kbGVyIGZvciB0aGUgcmVtb3ZlIGFjdGlvbi5cclxuICAgICAgICAgICAgIC8vIFRPRE86IE5lZWQgdG8gY29tbXVuaWNhdGUgd2l0aCBzZXJ2ZXIgZm9yIGRlbGV0aW9uIGlmIHRoZSBmaWxlIGlzIGFscmVhZHkgdXBsb2FkZWQuXHJcbiAgICAgICAgICAgICBzY29wZS5yZW1vdmVGaWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLmlzU2luZ2xlZmlsZVVwbG9hZCkge1xyXG4gICAgICAgICAgICAgICAgICAgXHRcdFx0XHQgICBcclxuXHRcdFx0XHQgICBpZihzY29wZS5waWNGaWxlICYmIHNjb3BlLnBpY0ZpbGUucmVzdWx0KSB7ICAvL0FscmVhZHkgdXBsb2FkZWQgZmlsZSwgcmVtb3ZlIHRoZSB3aG9sZSBmaWxlIG9iamVjdCBpbmNsdWRpbmcgZmlsZSBtZXRhZGF0YXNcclxuXHRcdFx0XHRcdFx0bmdNb2RlbC4kc2V0Vmlld1ZhbHVlKCk7XHJcblx0XHRcdFx0XHRcdG5nTW9kZWwuJGNvbW1pdFZpZXdWYWx1ZSgpO1xyXG5cdFx0XHRcdCAgIH1cclxuXHRcdFx0XHQgICBcclxuXHRcdFx0XHQgICBzY29wZS5waWNGaWxlID0gbnVsbDtcclxuXHRcdFx0XHQgICBcclxuXHRcdFx0XHQgICBpZihzY29wZS5yZW1vdmVXYXRjaEZvclJlcXVpcmVNZXRhZGF0YSkge1xyXG5cdFx0XHRcdFx0XHRzY29wZS5yZW1vdmVXYXRjaEZvclJlcXVpcmVNZXRhZGF0YSgpO1xyXG5cdFx0XHRcdFx0XHRkZWxldGUgc2NvcGUucmVtb3ZlV2F0Y2hGb3JSZXF1aXJlTWV0YWRhdGE7XHJcblx0XHRcdFx0XHRcdHNjb3BlLiRicm9hZGNhc3QoJ3NjaGVtYUZvcm0uZXJyb3IuJyArIHNjb3BlLmZvcm0ua2V5LmpvaW4oJy4nKSwgJ3JlcXVpcmVNZXRhZGF0YScsIHRydWUpO1xyXG5cdFx0XHRcdFx0XHR0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhmYWxzZSk7XHJcblx0XHRcdFx0ICAgfVxyXG5cdFx0XHRcdCAgIFxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgIGZ1bmN0aW9uIGRvVXBsb2FkKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChmaWxlICYmICFmaWxlLiRlcnJvciAmJiBzY29wZS51cmwpIHtcclxuICAgICAgICAgICAgICAgICAgIGZpbGUudXBsb2FkID0gVXBsb2FkLnVwbG9hZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICB1cmw6ICBzY29wZS51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXHJcbiAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICBmaWxlLnVwbG9hZC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5yZXN1bHQgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUocmVzcG9uc2UuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBuZ01vZGVsLiRjb21taXRWaWV3VmFsdWUoKTtcclxuICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmVycm9yTXNnID0gcmVzcG9uc2Uuc3RhdHVzICsgJzogJyArIHJlc3BvbnNlLmRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICBmaWxlLnVwbG9hZC5wcm9ncmVzcyhmdW5jdGlvbiAoZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBmaWxlLnByb2dyZXNzID0gTWF0aC5taW4oMTAwLCBwYXJzZUludCgxMDAuMCAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCkpO1xyXG4gICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgc2NvcGUudmFsaWRhdGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcdFx0XHRcdFxyXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZSAmJiBzY29wZS51cGxvYWRGb3JtLmZpbGUuJHZhbGlkICYmIHNjb3BlLnBpY0ZpbGUgJiYgIXNjb3BlLnBpY0ZpbGUuJGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzaW5nbGVmaWxlLWZvcm0gaXMgaW52YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzY29wZS51cGxvYWRGb3JtLmZpbGVzICYmIHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMuJHZhbGlkICYmIHNjb3BlLnBpY0ZpbGVzICYmICFzY29wZS5waWNGaWxlcy4kZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ211bHRpZmlsZS1mb3JtIGlzICBpbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnc2luZ2xlLSBhbmQgbXVsdGlmaWxlLWZvcm0gYXJlIHZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgc2NvcGUuc3VibWl0ICAgICAgICA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzY29wZS51cGxvYWRGb3JtLmZpbGUgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlICYmICFzY29wZS5waWNGaWxlLiRlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgc2NvcGUudXBsb2FkRmlsZShzY29wZS5waWNGaWxlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlcyAmJiBzY29wZS51cGxvYWRGb3JtLmZpbGVzLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlcyAmJiAhc2NvcGUucGljRmlsZXMuJGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICBzY29wZS51cGxvYWRGaWxlcyhzY29wZS5waWNGaWxlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgc2NvcGUuJG9uKCdzY2hlbWFGb3JtVmFsaWRhdGUnLCBzY29wZS52YWxpZGF0ZUZpZWxkKTtcclxuICAgICAgICAgICAgIHNjb3BlLiRvbignc2NoZW1hRm9ybUZpbGVVcGxvYWRTdWJtaXQnLCBzY29wZS5zdWJtaXQpO1xyXG5cdFx0XHQgXHJcblx0XHRcdCBmdW5jdGlvbiB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhyZXF1aXJlZCkge1xyXG5cdFx0XHRcdHZhciBmaWVsZFRvV2F0Y2ggPSBcIlwiXHJcblx0XHRcdFx0dmFyIG5leHQgPSBzY29wZS4kJHByZXZTaWJsaW5nO1xyXG5cdFx0XHRcdHdoaWxlKG5leHQgJiYgbmV4dC5mb3JtICYmIG5leHQuZm9ybS5rZXkgJiYgbmV4dC5mb3JtLmtleS5qb2luKCcuJykuc3RhcnRzV2l0aChzY29wZS5mb3JtLmtleS5qb2luKCcuJykpKSB7XHJcblx0XHRcdFx0XHRuZXh0LmZvcm0ucmVxdWlyZWQgPSByZXF1aXJlZDtcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRuZXh0LiRicm9hZGNhc3QoXCJzY2hlbWFGb3JtVmFsaWRhdGVcIik7XHJcblx0XHRcdFx0XHRmaWVsZFRvV2F0Y2ggKz1cIm1vZGVsLlwiK25leHQuZm9ybS5rZXkuam9pbignLicpK1wiJiZcIjtcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0bmV4dCA9IG5leHQuJCRwcmV2U2libGluZztcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYoZmllbGRUb1dhdGNoLmxlbmd0aD4wKSB7XHJcblx0XHRcdFx0XHRmaWVsZFRvV2F0Y2ggPSBmaWVsZFRvV2F0Y2guc3Vic3RyaW5nKDAsZmllbGRUb1dhdGNoLmxlbmd0aC0yKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0c2NvcGUuZmllbGRUb1dhdGNoID0gZmllbGRUb1dhdGNoO1xyXG5cdFx0XHQgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgfTtcclxuICAgIH1dKTtcclxuIixudWxsXX0=
