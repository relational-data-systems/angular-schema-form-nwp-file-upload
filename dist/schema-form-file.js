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
  .controller('ngSchemaFileController',['$scope', 'Upload', '$timeout', '$q', function($scope, Upload, $timeout, $q) {

    var vm = this;

    var scope = null,
        ngModel = null;

    vm.init = init;

    function init(_ngModel_) {
      ngModel = _ngModel_;
      scope = $scope;

      scope.url = scope.form && scope.form.endpoint;
      scope.isSinglefileUpload = scope.form && scope.form.schema && scope.form.schema.format === 'singlefile';

      scope.selectFile  = function (file) {
        if (!file) {
          return;
        }
        scope.picFile = file;

        if (scope.$$prevSibling && scope.$$prevSibling.form && scope.$$prevSibling.form.key.join('.').startsWith(scope.form.key.join('.'))) {
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
     
          if (scope.removeWatchForRequireMetadata) {
            scope.removeWatchForRequireMetadata();
            delete scope.removeWatchForRequireMetadata;
            scope.$broadcast('schemaForm.error.' + scope.form.key.join('.'), 'requireMetadata', true);
            toggleValidationFileMetadataComponents(false);
          }
        } else {}
      };

      function doUpload(file) {
        if (file && !file.$error && scope.url) {
          file.upload = Upload.upload({
            url:  scope.url,
            file: file,
            data: { metadata: ngModel.$modelValue}
          });

          file.upload.then(function(response) {
            $timeout(function () {
              file.result = response.data;
            });
            if (ngModel.$modelValue) {
              ngModel.$setViewValue(angular.merge( ngModel.$modelValue,response.data));
            } else {
              ngModel.$setViewValue(response.data);  
            }
            ngModel.$commitViewValue();
                
            var saveFormAfterUploaded = scope.form && scope.form.saveFormAfterUploaded;
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

          file.upload.progress(function(evt) {
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
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

      scope.submit = function () {
        if (scope.uploadForm.file && scope.uploadForm.file.$valid && scope.picFile && !scope.picFile.$error) {
          scope.uploadFile(scope.picFile);
        } else if (scope.uploadForm.files && scope.uploadForm.files.$valid && scope.picFiles && !scope.picFiles.$error) {
          scope.uploadFiles(scope.picFiles);
        }
      };

      scope.$on('schemaFormValidate', scope.validateField);
      scope.$on('schemaFormFileUploadSubmit', scope.submit);

      function toggleValidationFileMetadataComponents(required) {
        var fieldToWatch = "";
        var next = scope.$$prevSibling;
        while(next && next.form && next.form.key && next.form.key.join('.').startsWith(scope.form.key.join('.'))) {
          next.form.required = required;          
          next.$broadcast("schemaFormValidate");
          fieldToWatch += "model." + next.form.key.join('.') + "&&";
          next = next.$$prevSibling;            
        }
        if(fieldToWatch.length > 0) {
          fieldToWatch = fieldToWatch.substring(0, fieldToWatch.length - 2);
        }
        scope.fieldToWatch = fieldToWatch;
      }
    }

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
  .directive('ngSchemaFile', function() {
     return {
        restrict: 'A',
        scope: true,
        controller: 'ngSchemaFileController',
        controllerAs: 'fileUploadCtrl',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
          scope.fileUploadCtrl.init(ngModel);
        }
     };
  });

angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/nwp-file/nwp-file.html","<ng-form class=\"file-upload mb-lg\" ng-schema-file schema-validate=\"form\" sf-field-model=\"replaceAll\" ng-init=\"initInternalModel($$value$$)\" ng-model=\"$$value$$\" name=\"uploadForm\">\n   <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\n      {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\n   </label>\n\n   <div ng-show=\"picFile\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <div ng-include=\"\'uploadProcess.html\'\" class=\"mb\"></div>\n	  <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n\n   <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group\">\n      <li class=\"list-group-item\" ng-repeat=\"picFile in picFiles\">\n         <div ng-include=\"\'uploadProcess.html\'\"></div>\n      </li>\n   </ul>\n\n   <div ng-show=\"(isSinglefileUpload && !picFile) || (!isSinglefileUpload && (!picFiles || !picFiles.length))\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\n      <div ng-if=\"isSinglefileUpload\" ng-include=\"\'singleFileUpload.html\'\"></div>\n      <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'multiFileUpload.html\'\"></div>\n      <!--<div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>-->\n      <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n</ng-form>\n\n<script type=\'text/ng-template\' id=\"uploadProcess.html\">\n   <div class=\"row mb\">\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.preview\' | translate }}</label>\n         <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\n         <div class=\"img-placeholder\"\n              ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">No preview\n            available\n         </div>\n      </div>\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.filename\' | translate }}</label>\n         <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\n      </div>\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.progress\' | translate }}</label>\n         <div class=\"progress\">\n            <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\n                 ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\n                 ng-style=\"{width: picFile.progress + \'%\'}\">\n               {{ picFile.progress }} %\n            </div>\n         </div>\n         <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile)\"\n                 ng-disabled=\"ngModel.$error.requireMetadata||!picFile || picFile.result || picFile.$error\">{{ !picFile.result ?  \"buttons.upload\" : \"buttons.uploaded\" | translate }}\n         </button>\n         <button class=\"btn btn-danger btn-sm\" type=\"button\" ng-click=\"removeFile(picFile)\"\n                 ng-disabled=\"!picFile || picFile.$error\">{{ \"buttons.remove\" | translate }}\n         </button>\n      </div>\n   </div>\n   <div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\n      <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong>. ({{ form.schema[picFile.$error].validationMessage2 | translate }} <strong>{{picFile.size / 1000000|number:1}}MB</strong>)</div>\n      <div class=\"text-danger errorMsg\" ng-message=\"pattern\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{errorMsg}}</div>\n   </div>\n</script>\n\n<script type=\'text/ng-template\' id=\"singleFileUpload.html\">\n   <div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\n        ng-model=\"picFile\" name=\"file\"\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n        ng-required=\"form.required\"\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n      <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\n   </div>\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n   <button ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n           ng-required=\"form.required\"\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n   </button>\n</script>\n\n<script type=\'text/ng-template\' id=\"multiFileUpload.html\">\n   <div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\n        ng-model=\"picFiles\" name=\"files\"\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n        ng-required=\"form.required\"\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n      <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\n   </div>\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n   <button ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n           ng-required=\"form.required\"\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n   </button>\n</script>\n");}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OEVDL1BBIiwiZmlsZSI6InNjaGVtYS1mb3JtLWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXJcbiAgICAubW9kdWxlKCdzY2hlbWFGb3JtJylcbiAgICAuY29uZmlnKFsnc2NoZW1hRm9ybVByb3ZpZGVyJywgJ3NjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXInLCAnc2ZQYXRoUHJvdmlkZXInLCAnc2ZCdWlsZGVyUHJvdmlkZXInLFxuICAgICAgIGZ1bmN0aW9uIChzY2hlbWFGb3JtUHJvdmlkZXIsIHNjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXIsIHNmUGF0aFByb3ZpZGVyLCBzZkJ1aWxkZXJQcm92aWRlcikge1xuICAgICAgICAgIHZhciBkZWZhdWx0UGF0dGVybk1zZyAgPSAnV3JvbmcgZmlsZSB0eXBlLiBBbGxvd2VkIHR5cGVzIGFyZSAnLFxuICAgICAgICAgICAgICBkZWZhdWx0TWF4U2l6ZU1zZzEgPSAnVGhpcyBmaWxlIGlzIHRvbyBsYXJnZS4gTWF4aW11bSBzaXplIGFsbG93ZWQgaXMgJyxcbiAgICAgICAgICAgICAgZGVmYXVsdE1heFNpemVNc2cyID0gJ0N1cnJlbnQgZmlsZSBzaXplOicsXG4gICAgICAgICAgICAgIGRlZmF1bHRNaW5JdGVtc01zZyA9ICdZb3UgaGF2ZSB0byB1cGxvYWQgYXQgbGVhc3Qgb25lIGZpbGUnLFxuICAgICAgICAgICAgICBkZWZhdWx0TWF4SXRlbXNNc2cgPSAnWW91IGNhblxcJ3QgdXBsb2FkIG1vcmUgdGhhbiBvbmUgZmlsZS4nO1xuXG4gICAgICAgICAgdmFyIG53cFNpbmdsZWZpbGVVcGxvYWQgPSBmdW5jdGlvbiAobmFtZSwgc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgaWYgKHNjaGVtYS50eXBlID09PSAnYXJyYXknICYmIHNjaGVtYS5mb3JtYXQgPT09ICdzaW5nbGVmaWxlJykge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEucGF0dGVybi52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRQYXR0ZXJuTXNnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heFNpemUgJiYgc2NoZW1hLm1heFNpemUubWF4aW11bSAmJiAhc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSAgPSBkZWZhdWx0TWF4U2l6ZU1zZzE7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmIHNjaGVtYS5taW5JdGVtcy5taW5pbXVtICYmICFzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgc2NoZW1hLm1heEl0ZW1zLm1heGltdW0gJiYgIXNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHNjaGVtYUZvcm1Qcm92aWRlci5kZWZhdWx0cy5hcnJheS51bnNoaWZ0KG53cFNpbmdsZWZpbGVVcGxvYWQpO1xuXG4gICAgICAgICAgdmFyIG53cE11bHRpZmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdhcnJheScgJiYgc2NoZW1hLmZvcm1hdCA9PT0gJ211bHRpZmlsZScpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLnBhdHRlcm4gJiYgc2NoZW1hLnBhdHRlcm4ubWltZVR5cGUgJiYgIXNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0UGF0dGVybk1zZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5tYXhTaXplICYmIHNjaGVtYS5tYXhTaXplLm1heGltdW0gJiYgIXNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UgID0gZGVmYXVsdE1heFNpemVNc2cxO1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlMiA9IGRlZmF1bHRNYXhTaXplTXNnMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5taW5JdGVtcyAmJiBzY2hlbWEubWluSXRlbXMubWluaW11bSAmJiAhc2NoZW1hLm1pbkl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdE1pbkl0ZW1zTXNnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heEl0ZW1zICYmIHNjaGVtYS5tYXhJdGVtcy5tYXhpbXVtICYmICFzY2hlbWEubWF4SXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4SXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWF4SXRlbXNNc2c7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gc2NoZW1hRm9ybVByb3ZpZGVyLnN0ZEZvcm1PYmoobmFtZSwgc2NoZW1hLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBmLmtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBvcHRpb25zLnBhdGg7XG4gICAgICAgICAgICAgICAgZi50eXBlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gJ253cEZpbGVVcGxvYWQnO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMubG9va3VwW3NmUGF0aFByb3ZpZGVyLnN0cmluZ2lmeShvcHRpb25zLnBhdGgpXSA9IGY7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBzY2hlbWFGb3JtUHJvdmlkZXIuZGVmYXVsdHMuYXJyYXkudW5zaGlmdChud3BNdWx0aWZpbGVVcGxvYWQpO1xuXG4gICAgICAgICAgdmFyIG5nTW9kZWxPcHRpb25zID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMubmdNb2RlbE9wdGlvbnM7XG4gICAgICAgICAgdmFyIG5nTW9kZWwgPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5uZ01vZGVsO1xuICAgICAgICAgIHZhciBzZkZpZWxkID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMuc2ZGaWVsZDtcbiAgICAgICAgICB2YXIgY29uZGl0aW9uID0gc2ZCdWlsZGVyUHJvdmlkZXIuYnVpbGRlcnMuY29uZGl0aW9uOyAgICAgICAgICBcbiAgICAgICAgICB2YXIgY29tcGxleFZhbGlkYXRpb24gPSBzZkJ1aWxkZXJQcm92aWRlci5idWlsZGVycy5jb21wbGV4VmFsaWRhdGlvbjtcbiAgICAgICAgICB2YXIgZGVmYXVsdHMgPSBbc2ZGaWVsZCwgbmdNb2RlbCwgbmdNb2RlbE9wdGlvbnMsIGNvbmRpdGlvbiwgY29tcGxleFZhbGlkYXRpb25dO1xuXG4gICAgICAgICAgc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlci5kZWZpbmVBZGRPbihcbiAgICAgICAgICAgICAgJ2Jvb3RzdHJhcERlY29yYXRvcicsXG4gICAgICAgICAgICAgICdud3BGaWxlVXBsb2FkJyxcbiAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMvZGVjb3JhdG9ycy9ib290c3RyYXAvbndwLWZpbGUvbndwLWZpbGUuaHRtbCcsXG4gICAgICAgICAgICAgIGRlZmF1bHRzXG4gICAgICAgICAgKTtcblxuICAgICAgIH1cbiAgICBdKTtcblxuYW5ndWxhclxuICAubW9kdWxlKCduZ1NjaGVtYUZvcm1GaWxlJywgW1xuICAgICAnbmdGaWxlVXBsb2FkJyxcbiAgICAgJ25nTWVzc2FnZXMnXG4gIF0pXG4gIC5jb250cm9sbGVyKCduZ1NjaGVtYUZpbGVDb250cm9sbGVyJyxbJyRzY29wZScsICdVcGxvYWQnLCAnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbigkc2NvcGUsIFVwbG9hZCwgJHRpbWVvdXQsICRxKSB7XG5cbiAgICB2YXIgdm0gPSB0aGlzO1xuXG4gICAgdmFyIHNjb3BlID0gbnVsbCxcbiAgICAgICAgbmdNb2RlbCA9IG51bGw7XG5cbiAgICB2bS5pbml0ID0gaW5pdDtcblxuICAgIGZ1bmN0aW9uIGluaXQoX25nTW9kZWxfKSB7XG4gICAgICBuZ01vZGVsID0gX25nTW9kZWxfO1xuICAgICAgc2NvcGUgPSAkc2NvcGU7XG5cbiAgICAgIHNjb3BlLnVybCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5lbmRwb2ludDtcbiAgICAgIHNjb3BlLmlzU2luZ2xlZmlsZVVwbG9hZCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5zY2hlbWEgJiYgc2NvcGUuZm9ybS5zY2hlbWEuZm9ybWF0ID09PSAnc2luZ2xlZmlsZSc7XG5cbiAgICAgIHNjb3BlLnNlbGVjdEZpbGUgID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNjb3BlLnBpY0ZpbGUgPSBmaWxlO1xuXG4gICAgICAgIGlmIChzY29wZS4kJHByZXZTaWJsaW5nICYmIHNjb3BlLiQkcHJldlNpYmxpbmcuZm9ybSAmJiBzY29wZS4kJHByZXZTaWJsaW5nLmZvcm0ua2V5LmpvaW4oJy4nKS5zdGFydHNXaXRoKHNjb3BlLmZvcm0ua2V5LmpvaW4oJy4nKSkpIHtcbiAgICAgICAgICB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyh0cnVlKTtcbiAgICAgICAgICB2YXIgZXhwciA9IFwiZXZhbEV4cHIoJ1wiK3Njb3BlLmZpZWxkVG9XYXRjaCtcIicseyBtb2RlbDogbW9kZWwsICdhcnJheUluZGV4JzogMCwgJ21vZGVsVmFsdWUnOiAnJ30pXCI7XG4gICAgICAgICAgc2NvcGUucmVtb3ZlV2F0Y2hGb3JSZXF1aXJlTWV0YWRhdGEgPSBzY29wZS4kd2F0Y2goZXhwciwgZnVuY3Rpb24gd2F0Y2hJdCh2YWx1ZSkge1xuICAgICAgICAgICAgICBpZighdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYnJvYWRjYXN0KCdzY2hlbWFGb3JtLmVycm9yLicgKyBzY29wZS5mb3JtLmtleS5qb2luKCcuJyksICdyZXF1aXJlTWV0YWRhdGEnKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZm9ybS5rZXkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLnNlbGVjdEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgIHNjb3BlLnBpY0ZpbGVzID0gZmlsZXM7XG4gICAgICB9O1xuXG4gICAgICBzY29wZS51cGxvYWRGaWxlID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgZmlsZSAmJiBkb1VwbG9hZChmaWxlKTtcbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLnVwbG9hZEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgIGZpbGVzLmxlbmd0aCAmJiBhbmd1bGFyLmZvckVhY2goZmlsZXMsIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgZG9VcGxvYWQoZmlsZSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgLy8ga2VsaW46IGhhbmRsZXIgZm9yIHRoZSByZW1vdmUgYWN0aW9uLlxuICAgICAgLy8gVE9ETzogTmVlZCB0byBjb21tdW5pY2F0ZSB3aXRoIHNlcnZlciBmb3IgZGVsZXRpb24gaWYgdGhlIGZpbGUgaXMgYWxyZWFkeSB1cGxvYWRlZC5cbiAgICAgIHNjb3BlLnJlbW92ZUZpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzY29wZS5pc1NpbmdsZWZpbGVVcGxvYWQpIHtcbiAgICAgICAgICBpZihzY29wZS5waWNGaWxlICYmIHNjb3BlLnBpY0ZpbGUucmVzdWx0KSB7ICAvL0FscmVhZHkgdXBsb2FkZWQgZmlsZSwgcmVtb3ZlIHRoZSB3aG9sZSBmaWxlIG9iamVjdCBpbmNsdWRpbmcgZmlsZSBtZXRhZGF0YXNcbiAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZSgpO1xuICAgICAgICAgICAgbmdNb2RlbC4kY29tbWl0Vmlld1ZhbHVlKCk7XG4gICAgICAgICAgfVxuICAgICBcbiAgICAgICAgICBzY29wZS5waWNGaWxlID0gbnVsbDtcbiAgICAgXG4gICAgICAgICAgaWYgKHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICBzY29wZS5yZW1vdmVXYXRjaEZvclJlcXVpcmVNZXRhZGF0YSgpO1xuICAgICAgICAgICAgZGVsZXRlIHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhO1xuICAgICAgICAgICAgc2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZm9ybS5rZXkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgdHJ1ZSk7XG4gICAgICAgICAgICB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge31cbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGRvVXBsb2FkKGZpbGUpIHtcbiAgICAgICAgaWYgKGZpbGUgJiYgIWZpbGUuJGVycm9yICYmIHNjb3BlLnVybCkge1xuICAgICAgICAgIGZpbGUudXBsb2FkID0gVXBsb2FkLnVwbG9hZCh7XG4gICAgICAgICAgICB1cmw6ICBzY29wZS51cmwsXG4gICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgZGF0YTogeyBtZXRhZGF0YTogbmdNb2RlbC4kbW9kZWxWYWx1ZX1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGZpbGUudXBsb2FkLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgZmlsZS5yZXN1bHQgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAobmdNb2RlbC4kbW9kZWxWYWx1ZSkge1xuICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUoYW5ndWxhci5tZXJnZSggbmdNb2RlbC4kbW9kZWxWYWx1ZSxyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUocmVzcG9uc2UuZGF0YSk7ICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5nTW9kZWwuJGNvbW1pdFZpZXdWYWx1ZSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHNhdmVGb3JtQWZ0ZXJVcGxvYWRlZCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5zYXZlRm9ybUFmdGVyVXBsb2FkZWQ7XG4gICAgICAgICAgICBpZiAoc2F2ZUZvcm1BZnRlclVwbG9hZGVkKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRlbWl0KFwicmRzU2NoZW1hRm9ybUN0cmwuc2F2ZVwiLCB7XG4gICAgICAgICAgICAgICAgc291cmNlOiAnbmdTY2hlbWFGaWxlJyxcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgIGZvcm06IHNjb3BlLmZvcm1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID4gMCkge1xuICAgICAgICAgICAgICBzY29wZS5lcnJvck1zZyA9IHJlc3BvbnNlLnN0YXR1cyArICc6ICcgKyByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgZmlsZS51cGxvYWQucHJvZ3Jlc3MoZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICBmaWxlLnByb2dyZXNzID0gTWF0aC5taW4oMTAwLCBwYXJzZUludCgxMDAuMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWwpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzY29wZS52YWxpZGF0ZUZpZWxkID0gZnVuY3Rpb24gKCkgeyAgICAgICAgXG4gICAgICAgIGlmIChzY29wZS51cGxvYWRGb3JtLmZpbGUgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlICYmICFzY29wZS5waWNGaWxlLiRlcnJvcikge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ3NpbmdsZWZpbGUtZm9ybSBpcyBpbnZhbGlkJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlcyAmJiBzY29wZS51cGxvYWRGb3JtLmZpbGVzLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlcyAmJiAhc2NvcGUucGljRmlsZXMuJGVycm9yKSB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnbXVsdGlmaWxlLWZvcm0gaXMgIGludmFsaWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzaW5nbGUtIGFuZCBtdWx0aWZpbGUtZm9ybSBhcmUgdmFsaWQnKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlICYmIHNjb3BlLnVwbG9hZEZvcm0uZmlsZS4kdmFsaWQgJiYgc2NvcGUucGljRmlsZSAmJiAhc2NvcGUucGljRmlsZS4kZXJyb3IpIHtcbiAgICAgICAgICBzY29wZS51cGxvYWRGaWxlKHNjb3BlLnBpY0ZpbGUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlcy4kdmFsaWQgJiYgc2NvcGUucGljRmlsZXMgJiYgIXNjb3BlLnBpY0ZpbGVzLiRlcnJvcikge1xuICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGVzKHNjb3BlLnBpY0ZpbGVzKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NvcGUuJG9uKCdzY2hlbWFGb3JtVmFsaWRhdGUnLCBzY29wZS52YWxpZGF0ZUZpZWxkKTtcbiAgICAgIHNjb3BlLiRvbignc2NoZW1hRm9ybUZpbGVVcGxvYWRTdWJtaXQnLCBzY29wZS5zdWJtaXQpO1xuXG4gICAgICBmdW5jdGlvbiB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhyZXF1aXJlZCkge1xuICAgICAgICB2YXIgZmllbGRUb1dhdGNoID0gXCJcIjtcbiAgICAgICAgdmFyIG5leHQgPSBzY29wZS4kJHByZXZTaWJsaW5nO1xuICAgICAgICB3aGlsZShuZXh0ICYmIG5leHQuZm9ybSAmJiBuZXh0LmZvcm0ua2V5ICYmIG5leHQuZm9ybS5rZXkuam9pbignLicpLnN0YXJ0c1dpdGgoc2NvcGUuZm9ybS5rZXkuam9pbignLicpKSkge1xuICAgICAgICAgIG5leHQuZm9ybS5yZXF1aXJlZCA9IHJlcXVpcmVkOyAgICAgICAgICBcbiAgICAgICAgICBuZXh0LiRicm9hZGNhc3QoXCJzY2hlbWFGb3JtVmFsaWRhdGVcIik7XG4gICAgICAgICAgZmllbGRUb1dhdGNoICs9IFwibW9kZWwuXCIgKyBuZXh0LmZvcm0ua2V5LmpvaW4oJy4nKSArIFwiJiZcIjtcbiAgICAgICAgICBuZXh0ID0gbmV4dC4kJHByZXZTaWJsaW5nOyAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIGlmKGZpZWxkVG9XYXRjaC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZmllbGRUb1dhdGNoID0gZmllbGRUb1dhdGNoLnN1YnN0cmluZygwLCBmaWVsZFRvV2F0Y2gubGVuZ3RoIC0gMik7XG4gICAgICAgIH1cbiAgICAgICAgc2NvcGUuZmllbGRUb1dhdGNoID0gZmllbGRUb1dhdGNoO1xuICAgICAgfVxuICAgIH1cblxuICAgICRzY29wZS5pbml0SW50ZXJuYWxNb2RlbCA9IGZ1bmN0aW9uKG1vZGVsKXtcbiAgICAgIGlmKG1vZGVsICYmIG1vZGVsLnR5cGUgJiYgbW9kZWwubmFtZSkgeyAgICAgICBcbiAgICAgICAgJHNjb3BlLnBpY0ZpbGUgPSB7fTtcbiAgICAgICAgJHNjb3BlLnBpY0ZpbGUucmVzdWx0ID0gbW9kZWw7XG4gICAgICAgICRzY29wZS5waWNGaWxlLm5hbWUgPSBtb2RlbC5uYW1lO1xuICAgICAgICAkc2NvcGUucGljRmlsZS5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgJHNjb3BlLnBpY0ZpbGUuc2l6ZSA9IDA7XG4gICAgICAgICRzY29wZS5waWNGaWxlLnR5cGUgPSBtb2RlbC50eXBlO1xuICAgICAgfVxuICAgIH07XG5cbiAgfV0pXG4gIC5kaXJlY3RpdmUoJ25nU2NoZW1hRmlsZScsIGZ1bmN0aW9uKCkge1xuICAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBzY29wZTogdHJ1ZSxcbiAgICAgICAgY29udHJvbGxlcjogJ25nU2NoZW1hRmlsZUNvbnRyb2xsZXInLFxuICAgICAgICBjb250cm9sbGVyQXM6ICdmaWxlVXBsb2FkQ3RybCcsXG4gICAgICAgIHJlcXVpcmU6ICduZ01vZGVsJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbCkge1xuICAgICAgICAgIHNjb3BlLmZpbGVVcGxvYWRDdHJsLmluaXQobmdNb2RlbCk7XG4gICAgICAgIH1cbiAgICAgfTtcbiAgfSk7XG4iLG51bGxdfQ==
