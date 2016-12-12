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
                      file: file,
					  data: { metadata: ngModel.$modelValue}
                   });

                   file.upload.then(function (response) {
                      $timeout(function () {
                         file.result = response.data;
                      });
					  if(ngModel.$modelValue)
						  ngModel.$setViewValue(angular.merge( ngModel.$modelValue,response.data));
					  else 
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs4RUN4T0EiLCJmaWxlIjoic2NoZW1hLWZvcm0tZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXJcclxuICAgIC5tb2R1bGUoJ3NjaGVtYUZvcm0nKVxyXG4gICAgLmNvbmZpZyhbJ3NjaGVtYUZvcm1Qcm92aWRlcicsICdzY2hlbWFGb3JtRGVjb3JhdG9yc1Byb3ZpZGVyJywgJ3NmUGF0aFByb3ZpZGVyJywgJ3NmQnVpbGRlclByb3ZpZGVyJyxcclxuICAgICAgIGZ1bmN0aW9uIChzY2hlbWFGb3JtUHJvdmlkZXIsIHNjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXIsIHNmUGF0aFByb3ZpZGVyLCBzZkJ1aWxkZXJQcm92aWRlcikge1xyXG4gICAgICAgICAgdmFyIGRlZmF1bHRQYXR0ZXJuTXNnICA9ICdXcm9uZyBmaWxlIHR5cGUuIEFsbG93ZWQgdHlwZXMgYXJlICcsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdE1heFNpemVNc2cxID0gJ1RoaXMgZmlsZSBpcyB0b28gbGFyZ2UuIE1heGltdW0gc2l6ZSBhbGxvd2VkIGlzICcsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdE1heFNpemVNc2cyID0gJ0N1cnJlbnQgZmlsZSBzaXplOicsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdE1pbkl0ZW1zTXNnID0gJ1lvdSBoYXZlIHRvIHVwbG9hZCBhdCBsZWFzdCBvbmUgZmlsZScsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdE1heEl0ZW1zTXNnID0gJ1lvdSBjYW5cXCd0IHVwbG9hZCBtb3JlIHRoYW4gb25lIGZpbGUuJztcclxuXHJcbiAgICAgICAgICB2YXIgbndwU2luZ2xlZmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gJ2FycmF5JyAmJiBzY2hlbWEuZm9ybWF0ID09PSAnc2luZ2xlZmlsZScpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdFBhdHRlcm5Nc2c7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heFNpemUgJiYgc2NoZW1hLm1heFNpemUubWF4aW11bSAmJiAhc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlICA9IGRlZmF1bHRNYXhTaXplTXNnMTtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlMiA9IGRlZmF1bHRNYXhTaXplTXNnMjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWluSXRlbXMgJiYgc2NoZW1hLm1pbkl0ZW1zLm1pbmltdW0gJiYgIXNjaGVtYS5taW5JdGVtcy52YWxpZGF0aW9uTWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdE1pbkl0ZW1zTXNnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5tYXhJdGVtcyAmJiBzY2hlbWEubWF4SXRlbXMubWF4aW11bSAmJiAhc2NoZW1hLm1heEl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4SXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWF4SXRlbXNNc2c7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gc2NoZW1hRm9ybVByb3ZpZGVyLnN0ZEZvcm1PYmoobmFtZSwgc2NoZW1hLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcclxuICAgICAgICAgICAgICAgIGYudHlwZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9ICdud3BGaWxlVXBsb2FkJztcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMubG9va3VwW3NmUGF0aFByb3ZpZGVyLnN0cmluZ2lmeShvcHRpb25zLnBhdGgpXSA9IGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcclxuICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwU2luZ2xlZmlsZVVwbG9hZCk7XHJcblxyXG4gICAgICAgICAgdmFyIG53cE11bHRpZmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gJ2FycmF5JyAmJiBzY2hlbWEuZm9ybWF0ID09PSAnbXVsdGlmaWxlJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5wYXR0ZXJuICYmIHNjaGVtYS5wYXR0ZXJuLm1pbWVUeXBlICYmICFzY2hlbWEucGF0dGVybi52YWxpZGF0aW9uTWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0UGF0dGVybk1zZztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWF4U2l6ZSAmJiBzY2hlbWEubWF4U2l6ZS5tYXhpbXVtICYmICFzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UgID0gZGVmYXVsdE1heFNpemVNc2cxO1xyXG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5taW5JdGVtcyAmJiBzY2hlbWEubWluSXRlbXMubWluaW11bSAmJiAhc2NoZW1hLm1pbkl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heEl0ZW1zICYmIHNjaGVtYS5tYXhJdGVtcy5tYXhpbXVtICYmICFzY2hlbWEubWF4SXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gb3B0aW9ucy5wYXRoO1xyXG4gICAgICAgICAgICAgICAgZi50eXBlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gJ253cEZpbGVVcGxvYWQnO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmO1xyXG4gICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY2hlbWFGb3JtUHJvdmlkZXIuZGVmYXVsdHMuYXJyYXkudW5zaGlmdChud3BNdWx0aWZpbGVVcGxvYWQpO1xyXG5cclxuICAgICAgICAgIHZhciBuZ01vZGVsT3B0aW9ucyA9IHNmQnVpbGRlclByb3ZpZGVyLmJ1aWxkZXJzLm5nTW9kZWxPcHRpb25zO1xyXG4gICAgICAgICAgdmFyIG5nTW9kZWwgPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5uZ01vZGVsO1xyXG4gICAgICAgICAgdmFyIHNmRmllbGQgPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5zZkZpZWxkO1xyXG4gICAgICAgICAgdmFyIGNvbmRpdGlvbiA9IHNmQnVpbGRlclByb3ZpZGVyLmJ1aWxkZXJzLmNvbmRpdGlvbjsgICAgICAgICAgXHJcblx0XHQgIHZhciBjb21wbGV4VmFsaWRhdGlvbiA9IHNmQnVpbGRlclByb3ZpZGVyLmJ1aWxkZXJzLmNvbXBsZXhWYWxpZGF0aW9uO1xyXG4gICAgICAgICAgdmFyIGRlZmF1bHRzID0gW3NmRmllbGQsIG5nTW9kZWwsIG5nTW9kZWxPcHRpb25zLCBjb25kaXRpb24sIGNvbXBsZXhWYWxpZGF0aW9uXTtcclxuXHJcbiAgICAgICAgICBzY2hlbWFGb3JtRGVjb3JhdG9yc1Byb3ZpZGVyLmRlZmluZUFkZE9uKFxyXG4gICAgICAgICAgICAgICdib290c3RyYXBEZWNvcmF0b3InLFxyXG4gICAgICAgICAgICAgICdud3BGaWxlVXBsb2FkJyxcclxuICAgICAgICAgICAgICAnZGlyZWN0aXZlcy9kZWNvcmF0b3JzL2Jvb3RzdHJhcC9ud3AtZmlsZS9ud3AtZmlsZS5odG1sJyxcclxuICAgICAgICAgICAgICBkZWZhdWx0c1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICB9XHJcbiAgICBdKTtcclxuXHJcbmFuZ3VsYXJcclxuICAgIC5tb2R1bGUoJ25nU2NoZW1hRm9ybUZpbGUnLCBbXHJcbiAgICAgICAnbmdGaWxlVXBsb2FkJyxcclxuICAgICAgICduZ01lc3NhZ2VzJ1xyXG4gICAgXSlcclxuICAgIC5jb250cm9sbGVyKCduZ1NjaGVtYUZpbGVDb250cm9sbGVyJyxbJyRzY29wZScsIGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgJHNjb3BlLmluaXRJbnRlcm5hbE1vZGVsID0gZnVuY3Rpb24obW9kZWwpe1xyXG4gICAgICAgICAgaWYobW9kZWwgJiYgbW9kZWwudHlwZSAmJiBtb2RlbC5uYW1lKSB7XHRcdFx0ICBcclxuICAgICAgICAgICAgICRzY29wZS5waWNGaWxlID0ge307XHJcbiAgICAgICAgICAgICAkc2NvcGUucGljRmlsZS5yZXN1bHQgPSBtb2RlbDtcclxuICAgICAgICAgICAgICRzY29wZS5waWNGaWxlLm5hbWUgPSBtb2RlbC5uYW1lO1xyXG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUucHJvZ3Jlc3MgPSAxMDA7XHJcbiAgICAgICAgICAgICAkc2NvcGUucGljRmlsZS5zaXplID0gMDtcclxuICAgICAgICAgICAgICRzY29wZS5waWNGaWxlLnR5cGUgPSBtb2RlbC50eXBlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnbmdTY2hlbWFGaWxlJywgWydVcGxvYWQnLCAnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbiAoVXBsb2FkLCAkdGltZW91dCwgJHEpIHtcclxuICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgc2NvcGU6ICAgIHRydWUsXHJcbiAgICAgICAgICBjb250cm9sbGVyOiAnbmdTY2hlbWFGaWxlQ29udHJvbGxlcicsXHJcbiAgICAgICAgICByZXF1aXJlOiAgJ25nTW9kZWwnLFxyXG4gICAgICAgICAgbGluazogICAgIGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcclxuICAgICAgICAgICAgIHNjb3BlLnVybCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5lbmRwb2ludDtcclxuICAgICAgICAgICAgIHNjb3BlLmlzU2luZ2xlZmlsZVVwbG9hZCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5zY2hlbWEgJiYgc2NvcGUuZm9ybS5zY2hlbWEuZm9ybWF0ID09PSAnc2luZ2xlZmlsZSc7XHJcblxyXG4gICAgICAgICAgICAgc2NvcGUuc2VsZWN0RmlsZSAgPSBmdW5jdGlvbiAoZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYoIWZpbGUpIFxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgc2NvcGUucGljRmlsZSA9IGZpbGU7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYoc2NvcGUuJCRwcmV2U2libGluZyAmJiBzY29wZS4kJHByZXZTaWJsaW5nLmZvcm0gJiYgc2NvcGUuJCRwcmV2U2libGluZy5mb3JtLmtleS5qb2luKCcuJykuc3RhcnRzV2l0aChzY29wZS5mb3JtLmtleS5qb2luKCcuJykpKSB7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdHRvZ2dsZVZhbGlkYXRpb25GaWxlTWV0YWRhdGFDb21wb25lbnRzKHRydWUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0dmFyIGV4cHIgPSBcImV2YWxFeHByKCdcIitzY29wZS5maWVsZFRvV2F0Y2grXCInLHsgbW9kZWw6IG1vZGVsLCAnYXJyYXlJbmRleCc6IDAsICdtb2RlbFZhbHVlJzogJyd9KVwiO1xyXG5cdFx0XHRcdFx0c2NvcGUucmVtb3ZlV2F0Y2hGb3JSZXF1aXJlTWV0YWRhdGEgPSBzY29wZS4kd2F0Y2goZXhwciwgZnVuY3Rpb24gd2F0Y2hJdCh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRpZighdmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0XHRzY29wZS4kYnJvYWRjYXN0KCdzY2hlbWFGb3JtLmVycm9yLicgKyBzY29wZS5mb3JtLmtleS5qb2luKCcuJyksICdyZXF1aXJlTWV0YWRhdGEnKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRzY29wZS4kYnJvYWRjYXN0KCdzY2hlbWFGb3JtLmVycm9yLicgKyBzY29wZS5mb3JtLmtleS5qb2luKCcuJyksICdyZXF1aXJlTWV0YWRhdGEnLCB0cnVlKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG4gICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgIHNjb3BlLnNlbGVjdEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5waWNGaWxlcyA9IGZpbGVzO1xyXG4gICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICBzY29wZS51cGxvYWRGaWxlID0gZnVuY3Rpb24gKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGZpbGUgJiYgZG9VcGxvYWQoZmlsZSk7XHJcbiAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5sZW5ndGggJiYgYW5ndWxhci5mb3JFYWNoKGZpbGVzLCBmdW5jdGlvbiAoZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgZG9VcGxvYWQoZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgLy8ga2VsaW46IGhhbmRsZXIgZm9yIHRoZSByZW1vdmUgYWN0aW9uLlxyXG4gICAgICAgICAgICAgLy8gVE9ETzogTmVlZCB0byBjb21tdW5pY2F0ZSB3aXRoIHNlcnZlciBmb3IgZGVsZXRpb24gaWYgdGhlIGZpbGUgaXMgYWxyZWFkeSB1cGxvYWRlZC5cclxuICAgICAgICAgICAgIHNjb3BlLnJlbW92ZUZpbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNTaW5nbGVmaWxlVXBsb2FkKSB7XHJcbiAgICAgICAgICAgICAgICAgICBcdFx0XHRcdCAgIFxyXG5cdFx0XHRcdCAgIGlmKHNjb3BlLnBpY0ZpbGUgJiYgc2NvcGUucGljRmlsZS5yZXN1bHQpIHsgIC8vQWxyZWFkeSB1cGxvYWRlZCBmaWxlLCByZW1vdmUgdGhlIHdob2xlIGZpbGUgb2JqZWN0IGluY2x1ZGluZyBmaWxlIG1ldGFkYXRhc1xyXG5cdFx0XHRcdFx0XHRuZ01vZGVsLiRzZXRWaWV3VmFsdWUoKTtcclxuXHRcdFx0XHRcdFx0bmdNb2RlbC4kY29tbWl0Vmlld1ZhbHVlKCk7XHJcblx0XHRcdFx0ICAgfVxyXG5cdFx0XHRcdCAgIFxyXG5cdFx0XHRcdCAgIHNjb3BlLnBpY0ZpbGUgPSBudWxsO1xyXG5cdFx0XHRcdCAgIFxyXG5cdFx0XHRcdCAgIGlmKHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhKSB7XHJcblx0XHRcdFx0XHRcdHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhKCk7XHJcblx0XHRcdFx0XHRcdGRlbGV0ZSBzY29wZS5yZW1vdmVXYXRjaEZvclJlcXVpcmVNZXRhZGF0YTtcclxuXHRcdFx0XHRcdFx0c2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZm9ybS5rZXkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgdHJ1ZSk7XHJcblx0XHRcdFx0XHRcdHRvZ2dsZVZhbGlkYXRpb25GaWxlTWV0YWRhdGFDb21wb25lbnRzKGZhbHNlKTtcclxuXHRcdFx0XHQgICB9XHJcblx0XHRcdFx0ICAgXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgZnVuY3Rpb24gZG9VcGxvYWQoZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGUgJiYgIWZpbGUuJGVycm9yICYmIHNjb3BlLnVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgZmlsZS51cGxvYWQgPSBVcGxvYWQudXBsb2FkKHtcclxuICAgICAgICAgICAgICAgICAgICAgIHVybDogIHNjb3BlLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXHJcblx0XHRcdFx0XHQgIGRhdGE6IHsgbWV0YWRhdGE6IG5nTW9kZWwuJG1vZGVsVmFsdWV9XHJcbiAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICBmaWxlLnVwbG9hZC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5yZXN1bHQgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblx0XHRcdFx0XHQgIGlmKG5nTW9kZWwuJG1vZGVsVmFsdWUpXHJcblx0XHRcdFx0XHRcdCAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKGFuZ3VsYXIubWVyZ2UoIG5nTW9kZWwuJG1vZGVsVmFsdWUscmVzcG9uc2UuZGF0YSkpO1xyXG5cdFx0XHRcdFx0ICBlbHNlIFxyXG5cdFx0XHRcdFx0XHQgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZShyZXNwb25zZS5kYXRhKTsgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgbmdNb2RlbC4kY29tbWl0Vmlld1ZhbHVlKCk7XHJcbiAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5lcnJvck1zZyA9IHJlc3BvbnNlLnN0YXR1cyArICc6ICcgKyByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgZmlsZS51cGxvYWQucHJvZ3Jlc3MoZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IE1hdGgubWluKDEwMCwgcGFyc2VJbnQoMTAwLjAgKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5sb2FkZWQgLyBldnQudG90YWwpKTtcclxuICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgIHNjb3BlLnZhbGlkYXRlRmllbGQgPSBmdW5jdGlvbiAoKSB7XHRcdFx0XHRcclxuICAgICAgICAgICAgICAgIGlmIChzY29wZS51cGxvYWRGb3JtLmZpbGUgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlICYmICFzY29wZS5waWNGaWxlLiRlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnc2luZ2xlZmlsZS1mb3JtIGlzIGludmFsaWQnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlcyAmJiBzY29wZS51cGxvYWRGb3JtLmZpbGVzLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlcyAmJiAhc2NvcGUucGljRmlsZXMuJGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdtdWx0aWZpbGUtZm9ybSBpcyAgaW52YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3NpbmdsZS0gYW5kIG11bHRpZmlsZS1mb3JtIGFyZSB2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgIHNjb3BlLnN1Ym1pdCAgICAgICAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlICYmIHNjb3BlLnVwbG9hZEZvcm0uZmlsZS4kdmFsaWQgJiYgc2NvcGUucGljRmlsZSAmJiAhc2NvcGUucGljRmlsZS4kZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGUoc2NvcGUucGljRmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlcy4kdmFsaWQgJiYgc2NvcGUucGljRmlsZXMgJiYgIXNjb3BlLnBpY0ZpbGVzLiRlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgc2NvcGUudXBsb2FkRmlsZXMoc2NvcGUucGljRmlsZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgIHNjb3BlLiRvbignc2NoZW1hRm9ybVZhbGlkYXRlJywgc2NvcGUudmFsaWRhdGVGaWVsZCk7XHJcbiAgICAgICAgICAgICBzY29wZS4kb24oJ3NjaGVtYUZvcm1GaWxlVXBsb2FkU3VibWl0Jywgc2NvcGUuc3VibWl0KTtcclxuXHRcdFx0IFxyXG5cdFx0XHQgZnVuY3Rpb24gdG9nZ2xlVmFsaWRhdGlvbkZpbGVNZXRhZGF0YUNvbXBvbmVudHMocmVxdWlyZWQpIHtcclxuXHRcdFx0XHR2YXIgZmllbGRUb1dhdGNoID0gXCJcIlxyXG5cdFx0XHRcdHZhciBuZXh0ID0gc2NvcGUuJCRwcmV2U2libGluZztcclxuXHRcdFx0XHR3aGlsZShuZXh0ICYmIG5leHQuZm9ybSAmJiBuZXh0LmZvcm0ua2V5ICYmIG5leHQuZm9ybS5rZXkuam9pbignLicpLnN0YXJ0c1dpdGgoc2NvcGUuZm9ybS5rZXkuam9pbignLicpKSkge1xyXG5cdFx0XHRcdFx0bmV4dC5mb3JtLnJlcXVpcmVkID0gcmVxdWlyZWQ7XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0bmV4dC4kYnJvYWRjYXN0KFwic2NoZW1hRm9ybVZhbGlkYXRlXCIpO1xyXG5cdFx0XHRcdFx0ZmllbGRUb1dhdGNoICs9XCJtb2RlbC5cIituZXh0LmZvcm0ua2V5LmpvaW4oJy4nKStcIiYmXCI7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdG5leHQgPSBuZXh0LiQkcHJldlNpYmxpbmc7XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKGZpZWxkVG9XYXRjaC5sZW5ndGg+MCkge1xyXG5cdFx0XHRcdFx0ZmllbGRUb1dhdGNoID0gZmllbGRUb1dhdGNoLnN1YnN0cmluZygwLGZpZWxkVG9XYXRjaC5sZW5ndGgtMik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHNjb3BlLmZpZWxkVG9XYXRjaCA9IGZpZWxkVG9XYXRjaDtcclxuXHRcdFx0IH1cclxuICAgICAgICAgIH1cclxuICAgICAgIH07XHJcbiAgICB9XSk7XHJcbiIsbnVsbF19
