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

             var saveFormAfterUploaded = scope.form && scope.form.saveFormAfterUploaded;

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
					  if(ngModel.$modelValue) {
						  ngModel.$setViewValue(angular.merge( ngModel.$modelValue,response.data));
                      } else  {
						  ngModel.$setViewValue(response.data);  
                      }
                      ngModel.$commitViewValue();
                      
                      if (saveFormAfterUploaded) {
                         scope.$emit("rdsSchemaFormCtrl.save", {
                             source: 'ngSchemaFile',
                             file: file,
                             form: scope.form
                         });
                     }
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

angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/nwp-file/nwp-file.html","<ng-form class=\"file-upload mb-lg\" ng-schema-file schema-validate=\"form\" sf-field-model=\"replaceAll\" ng-init=\"initInternalModel($$value$$)\" ng-model=\"$$value$$\" name=\"uploadForm\">\n   <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\n      {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\n   </label>\n\n   <div ng-show=\"picFile\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <div ng-include=\"\'uploadProcess.html\'\" class=\"mb\"></div>\n	  <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n\n   <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group\">\n      <li class=\"list-group-item\" ng-repeat=\"picFile in picFiles\">\n         <div ng-include=\"\'uploadProcess.html\'\"></div>\n      </li>\n   </ul>\n\n   <div ng-show=\"(isSinglefileUpload && !picFile) || (!isSinglefileUpload && (!picFiles || !picFiles.length))\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\n      <div ng-if=\"isSinglefileUpload\" ng-include=\"\'singleFileUpload.html\'\"></div>\n      <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'multiFileUpload.html\'\"></div>\n      <!--<div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>-->\n      <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n</ng-form>\n\n<script type=\'text/ng-template\' id=\"uploadProcess.html\">\n   <div class=\"row mb\">\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.preview\' | translate }}</label>\n         <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\n         <div class=\"img-placeholder\"\n              ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">No preview\n            available\n         </div>\n      </div>\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.filename\' | translate }}</label>\n         <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\n      </div>\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.progress\' | translate }}</label>\n         <div class=\"progress\">\n            <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\n                 ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\n                 ng-style=\"{width: picFile.progress + \'%\'}\">\n               {{ picFile.progress }} %\n            </div>\n         </div>\n         <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile)\"\n                 ng-disabled=\"ngModel.$error.requireMetadata||!picFile || picFile.result || picFile.$error\">{{ !picFile.result ?  \"buttons.upload\" : \"buttons.uploaded\" | translate }}\n         </button>\n         <button class=\"btn btn-danger btn-sm\" type=\"button\" ng-click=\"removeFile(picFile)\"\n                 ng-disabled=\"!picFile || picFile.$error\">{{ \"buttons.remove\" | translate }}\n         </button>\n      </div>\n   </div>\n   <div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\n      <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong>. ({{ form.schema[picFile.$error].validationMessage2 | translate }} <strong>{{picFile.size / 1000000|number:1}}MB</strong>)</div>\n      <div class=\"text-danger errorMsg\" ng-message=\"pattern\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{errorMsg}}</div>\n   </div>\n</script>\n\n<script type=\'text/ng-template\' id=\"singleFileUpload.html\">\n   <div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\n        ng-model=\"picFile\" name=\"file\"\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n        ng-required=\"form.required\"\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n      <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\n   </div>\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n   <button ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n           ng-required=\"form.required\"\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n   </button>\n</script>\n\n<script type=\'text/ng-template\' id=\"multiFileUpload.html\">\n   <div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\n        ng-model=\"picFiles\" name=\"files\"\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n        ng-required=\"form.required\"\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n      <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\n   </div>\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n   <button ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n           ng-required=\"form.required\"\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n   </button>\n</script>\n");}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OEVDblBBIiwiZmlsZSI6InNjaGVtYS1mb3JtLWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXJcbiAgICAubW9kdWxlKCdzY2hlbWFGb3JtJylcbiAgICAuY29uZmlnKFsnc2NoZW1hRm9ybVByb3ZpZGVyJywgJ3NjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXInLCAnc2ZQYXRoUHJvdmlkZXInLCAnc2ZCdWlsZGVyUHJvdmlkZXInLFxuICAgICAgIGZ1bmN0aW9uIChzY2hlbWFGb3JtUHJvdmlkZXIsIHNjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXIsIHNmUGF0aFByb3ZpZGVyLCBzZkJ1aWxkZXJQcm92aWRlcikge1xuICAgICAgICAgIHZhciBkZWZhdWx0UGF0dGVybk1zZyAgPSAnV3JvbmcgZmlsZSB0eXBlLiBBbGxvd2VkIHR5cGVzIGFyZSAnLFxuICAgICAgICAgICAgICBkZWZhdWx0TWF4U2l6ZU1zZzEgPSAnVGhpcyBmaWxlIGlzIHRvbyBsYXJnZS4gTWF4aW11bSBzaXplIGFsbG93ZWQgaXMgJyxcbiAgICAgICAgICAgICAgZGVmYXVsdE1heFNpemVNc2cyID0gJ0N1cnJlbnQgZmlsZSBzaXplOicsXG4gICAgICAgICAgICAgIGRlZmF1bHRNaW5JdGVtc01zZyA9ICdZb3UgaGF2ZSB0byB1cGxvYWQgYXQgbGVhc3Qgb25lIGZpbGUnLFxuICAgICAgICAgICAgICBkZWZhdWx0TWF4SXRlbXNNc2cgPSAnWW91IGNhblxcJ3QgdXBsb2FkIG1vcmUgdGhhbiBvbmUgZmlsZS4nO1xuXG4gICAgICAgICAgdmFyIG53cFNpbmdsZWZpbGVVcGxvYWQgPSBmdW5jdGlvbiAobmFtZSwgc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgaWYgKHNjaGVtYS50eXBlID09PSAnYXJyYXknICYmIHNjaGVtYS5mb3JtYXQgPT09ICdzaW5nbGVmaWxlJykge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEucGF0dGVybi52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRQYXR0ZXJuTXNnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heFNpemUgJiYgc2NoZW1hLm1heFNpemUubWF4aW11bSAmJiAhc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSAgPSBkZWZhdWx0TWF4U2l6ZU1zZzE7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmIHNjaGVtYS5taW5JdGVtcy5taW5pbXVtICYmICFzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgc2NoZW1hLm1heEl0ZW1zLm1heGltdW0gJiYgIXNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHNjaGVtYUZvcm1Qcm92aWRlci5kZWZhdWx0cy5hcnJheS51bnNoaWZ0KG53cFNpbmdsZWZpbGVVcGxvYWQpO1xuXG4gICAgICAgICAgdmFyIG53cE11bHRpZmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdhcnJheScgJiYgc2NoZW1hLmZvcm1hdCA9PT0gJ211bHRpZmlsZScpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLnBhdHRlcm4gJiYgc2NoZW1hLnBhdHRlcm4ubWltZVR5cGUgJiYgIXNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0UGF0dGVybk1zZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5tYXhTaXplICYmIHNjaGVtYS5tYXhTaXplLm1heGltdW0gJiYgIXNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UgID0gZGVmYXVsdE1heFNpemVNc2cxO1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlMiA9IGRlZmF1bHRNYXhTaXplTXNnMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5taW5JdGVtcyAmJiBzY2hlbWEubWluSXRlbXMubWluaW11bSAmJiAhc2NoZW1hLm1pbkl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdE1pbkl0ZW1zTXNnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heEl0ZW1zICYmIHNjaGVtYS5tYXhJdGVtcy5tYXhpbXVtICYmICFzY2hlbWEubWF4SXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4SXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWF4SXRlbXNNc2c7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gc2NoZW1hRm9ybVByb3ZpZGVyLnN0ZEZvcm1PYmoobmFtZSwgc2NoZW1hLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBmLmtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBvcHRpb25zLnBhdGg7XG4gICAgICAgICAgICAgICAgZi50eXBlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gJ253cEZpbGVVcGxvYWQnO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMubG9va3VwW3NmUGF0aFByb3ZpZGVyLnN0cmluZ2lmeShvcHRpb25zLnBhdGgpXSA9IGY7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBzY2hlbWFGb3JtUHJvdmlkZXIuZGVmYXVsdHMuYXJyYXkudW5zaGlmdChud3BNdWx0aWZpbGVVcGxvYWQpO1xuXG4gICAgICAgICAgdmFyIG5nTW9kZWxPcHRpb25zID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMubmdNb2RlbE9wdGlvbnM7XG4gICAgICAgICAgdmFyIG5nTW9kZWwgPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5uZ01vZGVsO1xuICAgICAgICAgIHZhciBzZkZpZWxkID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMuc2ZGaWVsZDtcbiAgICAgICAgICB2YXIgY29uZGl0aW9uID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMuY29uZGl0aW9uOyAgICAgICAgICBcblx0XHQgIHZhciBjb21wbGV4VmFsaWRhdGlvbiA9IHNmQnVpbGRlclByb3ZpZGVyLmJ1aWxkZXJzLmNvbXBsZXhWYWxpZGF0aW9uO1xuICAgICAgICAgIHZhciBkZWZhdWx0cyA9IFtzZkZpZWxkLCBuZ01vZGVsLCBuZ01vZGVsT3B0aW9ucywgY29uZGl0aW9uLCBjb21wbGV4VmFsaWRhdGlvbl07XG5cbiAgICAgICAgICBzY2hlbWFGb3JtRGVjb3JhdG9yc1Byb3ZpZGVyLmRlZmluZUFkZE9uKFxuICAgICAgICAgICAgICAnYm9vdHN0cmFwRGVjb3JhdG9yJyxcbiAgICAgICAgICAgICAgJ253cEZpbGVVcGxvYWQnLFxuICAgICAgICAgICAgICAnZGlyZWN0aXZlcy9kZWNvcmF0b3JzL2Jvb3RzdHJhcC9ud3AtZmlsZS9ud3AtZmlsZS5odG1sJyxcbiAgICAgICAgICAgICAgZGVmYXVsdHNcbiAgICAgICAgICApO1xuXG4gICAgICAgfVxuICAgIF0pO1xuXG5hbmd1bGFyXG4gICAgLm1vZHVsZSgnbmdTY2hlbWFGb3JtRmlsZScsIFtcbiAgICAgICAnbmdGaWxlVXBsb2FkJyxcbiAgICAgICAnbmdNZXNzYWdlcydcbiAgICBdKVxuICAgIC5jb250cm9sbGVyKCduZ1NjaGVtYUZpbGVDb250cm9sbGVyJyxbJyRzY29wZScsIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgICRzY29wZS5pbml0SW50ZXJuYWxNb2RlbCA9IGZ1bmN0aW9uKG1vZGVsKXtcbiAgICAgICAgICBpZihtb2RlbCAmJiBtb2RlbC50eXBlICYmIG1vZGVsLm5hbWUpIHtcdFx0XHQgIFxuICAgICAgICAgICAgICRzY29wZS5waWNGaWxlID0ge307XG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUucmVzdWx0ID0gbW9kZWw7XG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUubmFtZSA9IG1vZGVsLm5hbWU7XG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUuc2l6ZSA9IDA7XG4gICAgICAgICAgICAgJHNjb3BlLnBpY0ZpbGUudHlwZSA9IG1vZGVsLnR5cGU7XG4gICAgICAgICAgfVxuICAgICAgIH07XG4gICAgfV0pXG4gICAgLmRpcmVjdGl2ZSgnbmdTY2hlbWFGaWxlJywgWydVcGxvYWQnLCAnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbiAoVXBsb2FkLCAkdGltZW91dCwgJHEpIHtcbiAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgICAgc2NvcGU6ICAgIHRydWUsXG4gICAgICAgICAgY29udHJvbGxlcjogJ25nU2NoZW1hRmlsZUNvbnRyb2xsZXInLFxuICAgICAgICAgIHJlcXVpcmU6ICAnbmdNb2RlbCcsXG4gICAgICAgICAgbGluazogICAgIGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcbiAgICAgICAgICAgICBzY29wZS51cmwgPSBzY29wZS5mb3JtICYmIHNjb3BlLmZvcm0uZW5kcG9pbnQ7XG4gICAgICAgICAgICAgc2NvcGUuaXNTaW5nbGVmaWxlVXBsb2FkID0gc2NvcGUuZm9ybSAmJiBzY29wZS5mb3JtLnNjaGVtYSAmJiBzY29wZS5mb3JtLnNjaGVtYS5mb3JtYXQgPT09ICdzaW5nbGVmaWxlJztcblxuICAgICAgICAgICAgIHZhciBzYXZlRm9ybUFmdGVyVXBsb2FkZWQgPSBzY29wZS5mb3JtICYmIHNjb3BlLmZvcm0uc2F2ZUZvcm1BZnRlclVwbG9hZGVkO1xuXG4gICAgICAgICAgICAgc2NvcGUuc2VsZWN0RmlsZSAgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGlmKCFmaWxlKSBcblx0XHRcdFx0XHRyZXR1cm47XG4gICAgICAgICAgICAgICAgc2NvcGUucGljRmlsZSA9IGZpbGU7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihzY29wZS4kJHByZXZTaWJsaW5nICYmIHNjb3BlLiQkcHJldlNpYmxpbmcuZm9ybSAmJiBzY29wZS4kJHByZXZTaWJsaW5nLmZvcm0ua2V5LmpvaW4oJy4nKS5zdGFydHNXaXRoKHNjb3BlLmZvcm0ua2V5LmpvaW4oJy4nKSkpIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyh0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIGV4cHIgPSBcImV2YWxFeHByKCdcIitzY29wZS5maWVsZFRvV2F0Y2grXCInLHsgbW9kZWw6IG1vZGVsLCAnYXJyYXlJbmRleCc6IDAsICdtb2RlbFZhbHVlJzogJyd9KVwiO1xuXHRcdFx0XHRcdHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhID0gc2NvcGUuJHdhdGNoKGV4cHIsIGZ1bmN0aW9uIHdhdGNoSXQodmFsdWUpIHtcblx0XHRcdFx0XHRcdGlmKCF2YWx1ZSkge1xuXHRcdFx0XHRcdFx0XHRzY29wZS4kYnJvYWRjYXN0KCdzY2hlbWFGb3JtLmVycm9yLicgKyBzY29wZS5mb3JtLmtleS5qb2luKCcuJyksICdyZXF1aXJlTWV0YWRhdGEnKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHNjb3BlLiRicm9hZGNhc3QoJ3NjaGVtYUZvcm0uZXJyb3IuJyArIHNjb3BlLmZvcm0ua2V5LmpvaW4oJy4nKSwgJ3JlcXVpcmVNZXRhZGF0YScsIHRydWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG4gICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICBzY29wZS5zZWxlY3RGaWxlcyA9IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICAgICAgICAgIHNjb3BlLnBpY0ZpbGVzID0gZmlsZXM7XG4gICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGZpbGUgJiYgZG9VcGxvYWQoZmlsZSk7XG4gICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgZmlsZXMubGVuZ3RoICYmIGFuZ3VsYXIuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICBkb1VwbG9hZChmaWxlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgLy8ga2VsaW46IGhhbmRsZXIgZm9yIHRoZSByZW1vdmUgYWN0aW9uLlxuICAgICAgICAgICAgIC8vIFRPRE86IE5lZWQgdG8gY29tbXVuaWNhdGUgd2l0aCBzZXJ2ZXIgZm9yIGRlbGV0aW9uIGlmIHRoZSBmaWxlIGlzIGFscmVhZHkgdXBsb2FkZWQuXG4gICAgICAgICAgICAgc2NvcGUucmVtb3ZlRmlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNTaW5nbGVmaWxlVXBsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgXHRcdFx0XHQgICBcblx0XHRcdFx0ICAgaWYoc2NvcGUucGljRmlsZSAmJiBzY29wZS5waWNGaWxlLnJlc3VsdCkgeyAgLy9BbHJlYWR5IHVwbG9hZGVkIGZpbGUsIHJlbW92ZSB0aGUgd2hvbGUgZmlsZSBvYmplY3QgaW5jbHVkaW5nIGZpbGUgbWV0YWRhdGFzXG5cdFx0XHRcdFx0XHRuZ01vZGVsLiRzZXRWaWV3VmFsdWUoKTtcblx0XHRcdFx0XHRcdG5nTW9kZWwuJGNvbW1pdFZpZXdWYWx1ZSgpO1xuXHRcdFx0XHQgICB9XG5cdFx0XHRcdCAgIFxuXHRcdFx0XHQgICBzY29wZS5waWNGaWxlID0gbnVsbDtcblx0XHRcdFx0ICAgXG5cdFx0XHRcdCAgIGlmKHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhKSB7XG5cdFx0XHRcdFx0XHRzY29wZS5yZW1vdmVXYXRjaEZvclJlcXVpcmVNZXRhZGF0YSgpO1xuXHRcdFx0XHRcdFx0ZGVsZXRlIHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhO1xuXHRcdFx0XHRcdFx0c2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZm9ybS5rZXkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgdHJ1ZSk7XG5cdFx0XHRcdFx0XHR0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhmYWxzZSk7XG5cdFx0XHRcdCAgIH1cblx0XHRcdFx0ICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgZnVuY3Rpb24gZG9VcGxvYWQoZmlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChmaWxlICYmICFmaWxlLiRlcnJvciAmJiBzY29wZS51cmwpIHtcbiAgICAgICAgICAgICAgICAgICBmaWxlLnVwbG9hZCA9IFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgICAgICAgICAgICAgIHVybDogIHNjb3BlLnVybCxcbiAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuXHRcdFx0XHRcdCAgZGF0YTogeyBtZXRhZGF0YTogbmdNb2RlbC4kbW9kZWxWYWx1ZX1cbiAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgIGZpbGUudXBsb2FkLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUucmVzdWx0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0XHRcdFx0XHQgIGlmKG5nTW9kZWwuJG1vZGVsVmFsdWUpIHtcblx0XHRcdFx0XHRcdCAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKGFuZ3VsYXIubWVyZ2UoIG5nTW9kZWwuJG1vZGVsVmFsdWUscmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSAge1xuXHRcdFx0XHRcdFx0ICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUocmVzcG9uc2UuZGF0YSk7ICBcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgbmdNb2RlbC4kY29tbWl0Vmlld1ZhbHVlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHNhdmVGb3JtQWZ0ZXJVcGxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiRlbWl0KFwicmRzU2NoZW1hRm9ybUN0cmwuc2F2ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ25nU2NoZW1hRmlsZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm06IHNjb3BlLmZvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmVycm9yTXNnID0gcmVzcG9uc2Uuc3RhdHVzICsgJzogJyArIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgZmlsZS51cGxvYWQucHJvZ3Jlc3MoZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSBNYXRoLm1pbigxMDAsIHBhcnNlSW50KDEwMC4wICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCkpO1xuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICBzY29wZS52YWxpZGF0ZUZpZWxkID0gZnVuY3Rpb24gKCkge1x0XHRcdFx0XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZSAmJiBzY29wZS51cGxvYWRGb3JtLmZpbGUuJHZhbGlkICYmIHNjb3BlLnBpY0ZpbGUgJiYgIXNjb3BlLnBpY0ZpbGUuJGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnc2luZ2xlZmlsZS1mb3JtIGlzIGludmFsaWQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlcy4kdmFsaWQgJiYgc2NvcGUucGljRmlsZXMgJiYgIXNjb3BlLnBpY0ZpbGVzLiRlcnJvcikge1xuICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ211bHRpZmlsZS1mb3JtIGlzICBpbnZhbGlkJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzaW5nbGUtIGFuZCBtdWx0aWZpbGUtZm9ybSBhcmUgdmFsaWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICBzY29wZS5zdWJtaXQgICAgICAgID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY29wZS51cGxvYWRGb3JtLmZpbGUgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlICYmICFzY29wZS5waWNGaWxlLiRlcnJvcikge1xuICAgICAgICAgICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGUoc2NvcGUucGljRmlsZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzY29wZS51cGxvYWRGb3JtLmZpbGVzICYmIHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMuJHZhbGlkICYmIHNjb3BlLnBpY0ZpbGVzICYmICFzY29wZS5waWNGaWxlcy4kZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICBzY29wZS51cGxvYWRGaWxlcyhzY29wZS5waWNGaWxlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgc2NvcGUuJG9uKCdzY2hlbWFGb3JtVmFsaWRhdGUnLCBzY29wZS52YWxpZGF0ZUZpZWxkKTtcbiAgICAgICAgICAgICBzY29wZS4kb24oJ3NjaGVtYUZvcm1GaWxlVXBsb2FkU3VibWl0Jywgc2NvcGUuc3VibWl0KTtcblx0XHRcdCBcblx0XHRcdCBmdW5jdGlvbiB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhyZXF1aXJlZCkge1xuXHRcdFx0XHR2YXIgZmllbGRUb1dhdGNoID0gXCJcIlxuXHRcdFx0XHR2YXIgbmV4dCA9IHNjb3BlLiQkcHJldlNpYmxpbmc7XG5cdFx0XHRcdHdoaWxlKG5leHQgJiYgbmV4dC5mb3JtICYmIG5leHQuZm9ybS5rZXkgJiYgbmV4dC5mb3JtLmtleS5qb2luKCcuJykuc3RhcnRzV2l0aChzY29wZS5mb3JtLmtleS5qb2luKCcuJykpKSB7XG5cdFx0XHRcdFx0bmV4dC5mb3JtLnJlcXVpcmVkID0gcmVxdWlyZWQ7XHRcdFx0XHRcdFxuXHRcdFx0XHRcdG5leHQuJGJyb2FkY2FzdChcInNjaGVtYUZvcm1WYWxpZGF0ZVwiKTtcblx0XHRcdFx0XHRmaWVsZFRvV2F0Y2ggKz1cIm1vZGVsLlwiK25leHQuZm9ybS5rZXkuam9pbignLicpK1wiJiZcIjtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRuZXh0ID0gbmV4dC4kJHByZXZTaWJsaW5nO1x0XHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGZpZWxkVG9XYXRjaC5sZW5ndGg+MCkge1xuXHRcdFx0XHRcdGZpZWxkVG9XYXRjaCA9IGZpZWxkVG9XYXRjaC5zdWJzdHJpbmcoMCxmaWVsZFRvV2F0Y2gubGVuZ3RoLTIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHNjb3BlLmZpZWxkVG9XYXRjaCA9IGZpZWxkVG9XYXRjaDtcblx0XHRcdCB9XG4gICAgICAgICAgfVxuICAgICAgIH07XG4gICAgfV0pO1xuIixudWxsXX0=
