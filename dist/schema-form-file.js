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
        var defaultPatternMsg = 'Wrong file type. Allowed types are ',
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
              schema.maxSize.validationMessage = defaultMaxSizeMsg1;
              schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
            }
            if (schema.minItems && schema.minItems.minimum && !schema.minItems.validationMessage) {
              schema.minItems.validationMessage = defaultMinItemsMsg;
            }
            if (schema.maxItems && schema.maxItems.maximum && !schema.maxItems.validationMessage) {
              schema.maxItems.validationMessage = defaultMaxItemsMsg;
            }

            var f = schemaFormProvider.stdFormObj(name, schema, options);
            f.key = options.path;
            f.type = 'nwpFileUpload';
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
              schema.maxSize.validationMessage = defaultMaxSizeMsg1;
              schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
            }
            if (schema.minItems && schema.minItems.minimum && !schema.minItems.validationMessage) {
              schema.minItems.validationMessage = defaultMinItemsMsg;
            }
            if (schema.maxItems && schema.maxItems.maximum && !schema.maxItems.validationMessage) {
              schema.maxItems.validationMessage = defaultMaxItemsMsg;
            }

            var f = schemaFormProvider.stdFormObj(name, schema, options);
            f.key = options.path;
            f.type = 'nwpFileUpload';
            options.lookup[sfPathProvider.stringify(options.path)] = f;
            return f;
          }
        };
        schemaFormProvider.defaults.array.unshift(nwpMultifileUpload);
        schemaFormDecoratorsProvider.defineAddOn(
              'bootstrapDecorator',
              'nwpFileUpload',
              'directives/decorators/bootstrap/nwp-file/nwp-file.html',
              // defaults
              sfBuilderProvider.stdBuilders
          );
      }
    ]);

angular
  .module('ngSchemaFormFile', [
    'ngFileUpload',
    'ngMessages'
  ])
  .controller('ngSchemaFileController', ['$scope', 'Upload', '$timeout', '$q', function ($scope, Upload, $timeout, $q) {
    var vm = this;

    var scope = null,
      ngModel = null;

    vm.init = init;

    function init (_ngModel_) {
      ngModel = _ngModel_;
      scope = $scope;

      scope.url = scope.form && scope.form.endpoint;
      scope.isSinglefileUpload = scope.form && scope.form.schema && scope.form.schema.format === 'singlefile';

      scope.selectFile = function (file) {
        if (!file) {
          return;
        }
        scope.picFile = file;

        if (scope.$$prevSibling && scope.$$prevSibling.form && scope.$$prevSibling.form.key.join('.').startsWith(scope.form.key.join('.'))) {
          toggleValidationFileMetadataComponents(true);
          var expr = "evalExpr('" + scope.fieldToWatch + "',{ model: model, 'arrayIndex': 0, 'modelValue': ''})";
          scope.removeWatchForRequireMetadata = scope.$watch(expr, function (value) {
            if (!value) {
              scope.$broadcast('schemaForm.error.' + scope.getModelPath().join('.'), 'requireMetadata', null, false);
            } else {
              scope.$broadcast('schemaForm.error.' + scope.getModelPath().join('.'), 'requireMetadata', null, true);
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
          if (scope.picFile && scope.picFile.result) {  // Already uploaded file, remove the whole file object including file metadatas
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

      function doUpload (file) {
        if (file && !file.$error && scope.url) {
          file.upload = Upload.upload({
            url: scope.url,
            file: file,
            data: { metadata: ngModel.$modelValue}
          });

          file.upload.then(function (response) {
            $timeout(function () {
              file.result = response.data;
            });
            if (ngModel.$modelValue) {
              ngModel.$setViewValue(angular.merge(ngModel.$modelValue, response.data));
            } else {
              ngModel.$setViewValue(response.data);
            }
            ngModel.$commitViewValue();

            var saveFormAfterUploaded = scope.form && scope.form.saveFormAfterUploaded;
            if (saveFormAfterUploaded) {
              scope.$emit('rdsSchemaFormCtrl.save', {
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
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
          });
        }
      }

      scope.validateField = function () {
        if (scope.uploadForm.file && scope.uploadForm.file.$valid && scope.picFile && !scope.picFile.$error) {
          // console.log('singlefile-form is invalid');
        } else if (scope.uploadForm.files && scope.uploadForm.files.$valid && scope.picFiles && !scope.picFiles.$error) {
          // console.log('multifile-form is  invalid');
        } else {
          // console.log('single- and multifile-form are valid');
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

      function toggleValidationFileMetadataComponents (required) {
        var fieldToWatch = '';
        var next = scope.$$prevSibling;
        while (next && next.form && next.form.key && next.form.key.join('.').startsWith(scope.form.key.join('.'))) {
          next.form.required = required;
          next.$broadcast('schemaFormValidate');
          fieldToWatch += 'model.' + next.form.key.join('.') + '&&';
          next = next.$$prevSibling;
        }
        if (fieldToWatch.length > 0) {
          fieldToWatch = fieldToWatch.substring(0, fieldToWatch.length - 2);
        }
        scope.fieldToWatch = fieldToWatch;
      }
    }

    $scope.initInternalModel = function (model) {
      if (model && model.type && model.name) {
        $scope.picFile = {};
        $scope.picFile.result = model;
        $scope.picFile.name = model.name;
        $scope.picFile.progress = 100;
        $scope.picFile.size = 0;
        $scope.picFile.type = model.type;
      }
    };
  }])
  .directive('ngSchemaFile', function () {
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

angular.module('schemaForm').run(['$templateCache', function ($templateCache) { $templateCache.put('directives/decorators/bootstrap/nwp-file/nwp-file.html', "<ng-form class=\"file-upload mb-lg\" ng-schema-file schema-validate=\"form\" sf-field-model=\"replaceAll\" ng-init=\"initInternalModel($$value$$)\" ng-model=\"$$value$$\" name=\"uploadForm\">\n   <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\n      {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\n   </label>\n\n   <div ng-show=\"picFile\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <div ng-include=\"\'uploadProcess.html\'\" class=\"mb\"></div>\n	  <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n\n   <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group\">\n      <li class=\"list-group-item\" ng-repeat=\"picFile in picFiles\">\n         <div ng-include=\"\'uploadProcess.html\'\"></div>\n      </li>\n   </ul>\n\n   <div ng-show=\"(isSinglefileUpload && !picFile) || (!isSinglefileUpload && (!picFiles || !picFiles.length))\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\n      <div ng-if=\"isSinglefileUpload\" ng-include=\"\'singleFileUpload.html\'\"></div>\n      <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'multiFileUpload.html\'\"></div>\n      <!--<div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>-->\n      <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n</ng-form>\n\n<script type=\'text/ng-template\' id=\"uploadProcess.html\">\n   <div class=\"row mb\">\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.preview\' | translate }}</label>\n         <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\n         <div class=\"img-placeholder\"\n              ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">No preview\n            available\n         </div>\n      </div>\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.filename\' | translate }}</label>\n         <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\n      </div>\n      <div class=\"col-sm-4 mb-sm\">\n         <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\n            \'modules.upload.field.progress\' | translate }}</label>\n         <div class=\"progress\">\n            <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\n                 ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\n                 ng-style=\"{width: picFile.progress + \'%\'}\">\n               {{ picFile.progress }} %\n            </div>\n         </div>\n         <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile)\"\n                 ng-disabled=\"ngModel.$error.requireMetadata||!picFile || picFile.result || picFile.$error\">{{ !picFile.result ?  \"buttons.upload\" : \"buttons.uploaded\" | translate }}\n         </button>\n         <button class=\"btn btn-danger btn-sm\" type=\"button\" ng-click=\"removeFile(picFile)\"\n                 ng-disabled=\"!picFile || picFile.$error\">{{ \"buttons.remove\" | translate }}\n         </button>\n      </div>\n   </div>\n   <div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\n      <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong>. ({{ form.schema[picFile.$error].validationMessage2 | translate }} <strong>{{picFile.size / 1000000|number:1}}MB</strong>)</div>\n      <div class=\"text-danger errorMsg\" ng-message=\"pattern\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n      <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{errorMsg}}</div>\n   </div>\n</script>\n\n<script type=\'text/ng-template\' id=\"singleFileUpload.html\">\n   <div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\n        ng-model=\"picFile\" name=\"file\"\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n        ng-required=\"form.required\"\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n      <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\n   </div>\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n   <button ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n           ng-required=\"form.required\"\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n   </button>\n</script>\n\n<script type=\'text/ng-template\' id=\"multiFileUpload.html\">\n   <div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\n        ng-model=\"picFiles\" name=\"files\"\n        ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n        ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n        ng-required=\"form.required\"\n        accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n        ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n      <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\n   </div>\n   <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n   <button ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\n           accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n           ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n           ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n           ng-required=\"form.required\"\n           ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n           class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n   </button>\n</script>\n"); }]);
// # sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs4RUN2UEEiLCJmaWxlIjoic2NoZW1hLWZvcm0tZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuYW5ndWxhclxuICAgIC5tb2R1bGUoJ3NjaGVtYUZvcm0nKVxuICAgIC5jb25maWcoWydzY2hlbWFGb3JtUHJvdmlkZXInLCAnc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlcicsICdzZlBhdGhQcm92aWRlcicsICdzZkJ1aWxkZXJQcm92aWRlcicsXG4gICAgICAgZnVuY3Rpb24gKHNjaGVtYUZvcm1Qcm92aWRlciwgc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlciwgc2ZQYXRoUHJvdmlkZXIsIHNmQnVpbGRlclByb3ZpZGVyKSB7XG4gICAgICAgICAgdmFyIGRlZmF1bHRQYXR0ZXJuTXNnICA9ICdXcm9uZyBmaWxlIHR5cGUuIEFsbG93ZWQgdHlwZXMgYXJlICcsXG4gICAgICAgICAgICAgIGRlZmF1bHRNYXhTaXplTXNnMSA9ICdUaGlzIGZpbGUgaXMgdG9vIGxhcmdlLiBNYXhpbXVtIHNpemUgYWxsb3dlZCBpcyAnLFxuICAgICAgICAgICAgICBkZWZhdWx0TWF4U2l6ZU1zZzIgPSAnQ3VycmVudCBmaWxlIHNpemU6JyxcbiAgICAgICAgICAgICAgZGVmYXVsdE1pbkl0ZW1zTXNnID0gJ1lvdSBoYXZlIHRvIHVwbG9hZCBhdCBsZWFzdCBvbmUgZmlsZScsXG4gICAgICAgICAgICAgIGRlZmF1bHRNYXhJdGVtc01zZyA9ICdZb3UgY2FuXFwndCB1cGxvYWQgbW9yZSB0aGFuIG9uZSBmaWxlLic7XG5cbiAgICAgICAgICB2YXIgbndwU2luZ2xlZmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdhcnJheScgJiYgc2NoZW1hLmZvcm1hdCA9PT0gJ3NpbmdsZWZpbGUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5wYXR0ZXJuICYmIHNjaGVtYS5wYXR0ZXJuLm1pbWVUeXBlICYmICFzY2hlbWEucGF0dGVybi52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdFBhdHRlcm5Nc2c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWF4U2l6ZSAmJiBzY2hlbWEubWF4U2l6ZS5tYXhpbXVtICYmICFzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhTaXplLnZhbGlkYXRpb25NZXNzYWdlICA9IGRlZmF1bHRNYXhTaXplTXNnMTtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZTIgPSBkZWZhdWx0TWF4U2l6ZU1zZzI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWluSXRlbXMgJiYgc2NoZW1hLm1pbkl0ZW1zLm1pbmltdW0gJiYgIXNjaGVtYS5taW5JdGVtcy52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5taW5JdGVtcy52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNaW5JdGVtc01zZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5tYXhJdGVtcyAmJiBzY2hlbWEubWF4SXRlbXMubWF4aW11bSAmJiAhc2NoZW1hLm1heEl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heEl0ZW1zLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdE1heEl0ZW1zTXNnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBmICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHNjaGVtYUZvcm1Qcm92aWRlci5zdGRGb3JtT2JqKG5hbWUsIHNjaGVtYSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gb3B0aW9ucy5wYXRoO1xuICAgICAgICAgICAgICAgIGYudHlwZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9ICdud3BGaWxlVXBsb2FkJztcbiAgICAgICAgICAgICAgICBvcHRpb25zLmxvb2t1cFtzZlBhdGhQcm92aWRlci5zdHJpbmdpZnkob3B0aW9ucy5wYXRoKV0gPSBmO1xuICAgICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwU2luZ2xlZmlsZVVwbG9hZCk7XG5cbiAgICAgICAgICB2YXIgbndwTXVsdGlmaWxlVXBsb2FkID0gZnVuY3Rpb24gKG5hbWUsIHNjaGVtYSwgb3B0aW9ucykge1xuICAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gJ2FycmF5JyAmJiBzY2hlbWEuZm9ybWF0ID09PSAnbXVsdGlmaWxlJykge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEucGF0dGVybi52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRQYXR0ZXJuTXNnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heFNpemUgJiYgc2NoZW1hLm1heFNpemUubWF4aW11bSAmJiAhc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSAgPSBkZWZhdWx0TWF4U2l6ZU1zZzE7XG4gICAgICAgICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmIHNjaGVtYS5taW5JdGVtcy5taW5pbXVtICYmICFzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICBzY2hlbWEubWluSXRlbXMudmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgc2NoZW1hLm1heEl0ZW1zLm1heGltdW0gJiYgIXNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgIHNjaGVtYS5tYXhJdGVtcy52YWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICBzY2hlbWFGb3JtUHJvdmlkZXIuZGVmYXVsdHMuYXJyYXkudW5zaGlmdChud3BNdWx0aWZpbGVVcGxvYWQpO1xuICAgICAgICAgIHNjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXIuZGVmaW5lQWRkT24oXG4gICAgICAgICAgICAgICdib290c3RyYXBEZWNvcmF0b3InLFxuICAgICAgICAgICAgICAnbndwRmlsZVVwbG9hZCcsXG4gICAgICAgICAgICAgICdkaXJlY3RpdmVzL2RlY29yYXRvcnMvYm9vdHN0cmFwL253cC1maWxlL253cC1maWxlLmh0bWwnLFxuICAgICAgICAgICAgICAvLyBkZWZhdWx0c1xuICAgICAgICAgICAgICBzZkJ1aWxkZXJQcm92aWRlci5zdGRCdWlsZGVyc1xuICAgICAgICAgICk7XG5cbiAgICAgICB9XG4gICAgXSk7XG5cbmFuZ3VsYXJcbiAgLm1vZHVsZSgnbmdTY2hlbWFGb3JtRmlsZScsIFtcbiAgICAgJ25nRmlsZVVwbG9hZCcsXG4gICAgICduZ01lc3NhZ2VzJ1xuICBdKVxuICAuY29udHJvbGxlcignbmdTY2hlbWFGaWxlQ29udHJvbGxlcicsWyckc2NvcGUnLCAnVXBsb2FkJywgJyR0aW1lb3V0JywgJyRxJywgZnVuY3Rpb24oJHNjb3BlLCBVcGxvYWQsICR0aW1lb3V0LCAkcSkge1xuXG4gICAgdmFyIHZtID0gdGhpcztcblxuICAgIHZhciBzY29wZSA9IG51bGwsXG4gICAgICAgIG5nTW9kZWwgPSBudWxsO1xuXG4gICAgdm0uaW5pdCA9IGluaXQ7XG5cbiAgICBmdW5jdGlvbiBpbml0KF9uZ01vZGVsXykge1xuICAgICAgbmdNb2RlbCA9IF9uZ01vZGVsXztcbiAgICAgIHNjb3BlID0gJHNjb3BlO1xuXG4gICAgICBzY29wZS51cmwgPSBzY29wZS5mb3JtICYmIHNjb3BlLmZvcm0uZW5kcG9pbnQ7XG4gICAgICBzY29wZS5pc1NpbmdsZWZpbGVVcGxvYWQgPSBzY29wZS5mb3JtICYmIHNjb3BlLmZvcm0uc2NoZW1hICYmIHNjb3BlLmZvcm0uc2NoZW1hLmZvcm1hdCA9PT0gJ3NpbmdsZWZpbGUnO1xuXG4gICAgICBzY29wZS5zZWxlY3RGaWxlICA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzY29wZS5waWNGaWxlID0gZmlsZTtcblxuICAgICAgICBpZiAoc2NvcGUuJCRwcmV2U2libGluZyAmJiBzY29wZS4kJHByZXZTaWJsaW5nLmZvcm0gJiYgc2NvcGUuJCRwcmV2U2libGluZy5mb3JtLmtleS5qb2luKCcuJykuc3RhcnRzV2l0aChzY29wZS5mb3JtLmtleS5qb2luKCcuJykpKSB7XG4gICAgICAgICAgdG9nZ2xlVmFsaWRhdGlvbkZpbGVNZXRhZGF0YUNvbXBvbmVudHModHJ1ZSk7XG4gICAgICAgICAgdmFyIGV4cHIgPSBcImV2YWxFeHByKCdcIitzY29wZS5maWVsZFRvV2F0Y2grXCInLHsgbW9kZWw6IG1vZGVsLCAnYXJyYXlJbmRleCc6IDAsICdtb2RlbFZhbHVlJzogJyd9KVwiO1xuICAgICAgICAgIHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhID0gc2NvcGUuJHdhdGNoKGV4cHIsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZighdmFsdWUpIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZ2V0TW9kZWxQYXRoKCkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgbnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZ2V0TW9kZWxQYXRoKCkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgbnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLnNlbGVjdEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgIHNjb3BlLnBpY0ZpbGVzID0gZmlsZXM7XG4gICAgICB9O1xuXG4gICAgICBzY29wZS51cGxvYWRGaWxlID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgZmlsZSAmJiBkb1VwbG9hZChmaWxlKTtcbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLnVwbG9hZEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgIGZpbGVzLmxlbmd0aCAmJiBhbmd1bGFyLmZvckVhY2goZmlsZXMsIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgZG9VcGxvYWQoZmlsZSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgLy8ga2VsaW46IGhhbmRsZXIgZm9yIHRoZSByZW1vdmUgYWN0aW9uLlxuICAgICAgLy8gVE9ETzogTmVlZCB0byBjb21tdW5pY2F0ZSB3aXRoIHNlcnZlciBmb3IgZGVsZXRpb24gaWYgdGhlIGZpbGUgaXMgYWxyZWFkeSB1cGxvYWRlZC5cbiAgICAgIHNjb3BlLnJlbW92ZUZpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzY29wZS5pc1NpbmdsZWZpbGVVcGxvYWQpIHtcbiAgICAgICAgICBpZihzY29wZS5waWNGaWxlICYmIHNjb3BlLnBpY0ZpbGUucmVzdWx0KSB7ICAvL0FscmVhZHkgdXBsb2FkZWQgZmlsZSwgcmVtb3ZlIHRoZSB3aG9sZSBmaWxlIG9iamVjdCBpbmNsdWRpbmcgZmlsZSBtZXRhZGF0YXNcbiAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZSgpO1xuICAgICAgICAgICAgbmdNb2RlbC4kY29tbWl0Vmlld1ZhbHVlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2NvcGUucGljRmlsZSA9IG51bGw7XG5cbiAgICAgICAgICBpZiAoc2NvcGUucmVtb3ZlV2F0Y2hGb3JSZXF1aXJlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgIHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhKCk7XG4gICAgICAgICAgICBkZWxldGUgc2NvcGUucmVtb3ZlV2F0Y2hGb3JSZXF1aXJlTWV0YWRhdGE7XG4gICAgICAgICAgICBzY29wZS4kYnJvYWRjYXN0KCdzY2hlbWFGb3JtLmVycm9yLicgKyBzY29wZS5mb3JtLmtleS5qb2luKCcuJyksICdyZXF1aXJlTWV0YWRhdGEnLCB0cnVlKTtcbiAgICAgICAgICAgIHRvZ2dsZVZhbGlkYXRpb25GaWxlTWV0YWRhdGFDb21wb25lbnRzKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7fVxuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gZG9VcGxvYWQoZmlsZSkge1xuICAgICAgICBpZiAoZmlsZSAmJiAhZmlsZS4kZXJyb3IgJiYgc2NvcGUudXJsKSB7XG4gICAgICAgICAgZmlsZS51cGxvYWQgPSBVcGxvYWQudXBsb2FkKHtcbiAgICAgICAgICAgIHVybDogIHNjb3BlLnVybCxcbiAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICBkYXRhOiB7IG1ldGFkYXRhOiBuZ01vZGVsLiRtb2RlbFZhbHVlfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgZmlsZS51cGxvYWQudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBmaWxlLnJlc3VsdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChuZ01vZGVsLiRtb2RlbFZhbHVlKSB7XG4gICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZShhbmd1bGFyLm1lcmdlKCBuZ01vZGVsLiRtb2RlbFZhbHVlLHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5nTW9kZWwuJGNvbW1pdFZpZXdWYWx1ZSgpO1xuXG4gICAgICAgICAgICB2YXIgc2F2ZUZvcm1BZnRlclVwbG9hZGVkID0gc2NvcGUuZm9ybSAmJiBzY29wZS5mb3JtLnNhdmVGb3JtQWZ0ZXJVcGxvYWRlZDtcbiAgICAgICAgICAgIGlmIChzYXZlRm9ybUFmdGVyVXBsb2FkZWQpIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGVtaXQoXCJyZHNTY2hlbWFGb3JtQ3RybC5zYXZlXCIsIHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6ICduZ1NjaGVtYUZpbGUnLFxuICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgZm9ybTogc2NvcGUuZm9ybVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPiAwKSB7XG4gICAgICAgICAgICAgIHNjb3BlLmVycm9yTXNnID0gcmVzcG9uc2Uuc3RhdHVzICsgJzogJyArIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBmaWxlLnVwbG9hZC5wcm9ncmVzcyhmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSBNYXRoLm1pbigxMDAsIHBhcnNlSW50KDEwMC4wICogZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNjb3BlLnZhbGlkYXRlRmllbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzY29wZS51cGxvYWRGb3JtLmZpbGUgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlICYmICFzY29wZS5waWNGaWxlLiRlcnJvcikge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ3NpbmdsZWZpbGUtZm9ybSBpcyBpbnZhbGlkJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlcyAmJiBzY29wZS51cGxvYWRGb3JtLmZpbGVzLiR2YWxpZCAmJiBzY29wZS5waWNGaWxlcyAmJiAhc2NvcGUucGljRmlsZXMuJGVycm9yKSB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnbXVsdGlmaWxlLWZvcm0gaXMgIGludmFsaWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzaW5nbGUtIGFuZCBtdWx0aWZpbGUtZm9ybSBhcmUgdmFsaWQnKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlICYmIHNjb3BlLnVwbG9hZEZvcm0uZmlsZS4kdmFsaWQgJiYgc2NvcGUucGljRmlsZSAmJiAhc2NvcGUucGljRmlsZS4kZXJyb3IpIHtcbiAgICAgICAgICBzY29wZS51cGxvYWRGaWxlKHNjb3BlLnBpY0ZpbGUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlcy4kdmFsaWQgJiYgc2NvcGUucGljRmlsZXMgJiYgIXNjb3BlLnBpY0ZpbGVzLiRlcnJvcikge1xuICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGVzKHNjb3BlLnBpY0ZpbGVzKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NvcGUuJG9uKCdzY2hlbWFGb3JtVmFsaWRhdGUnLCBzY29wZS52YWxpZGF0ZUZpZWxkKTtcbiAgICAgIHNjb3BlLiRvbignc2NoZW1hRm9ybUZpbGVVcGxvYWRTdWJtaXQnLCBzY29wZS5zdWJtaXQpO1xuXG4gICAgICBmdW5jdGlvbiB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhyZXF1aXJlZCkge1xuICAgICAgICB2YXIgZmllbGRUb1dhdGNoID0gXCJcIjtcbiAgICAgICAgdmFyIG5leHQgPSBzY29wZS4kJHByZXZTaWJsaW5nO1xuICAgICAgICB3aGlsZShuZXh0ICYmIG5leHQuZm9ybSAmJiBuZXh0LmZvcm0ua2V5ICYmIG5leHQuZm9ybS5rZXkuam9pbignLicpLnN0YXJ0c1dpdGgoc2NvcGUuZm9ybS5rZXkuam9pbignLicpKSkge1xuICAgICAgICAgIG5leHQuZm9ybS5yZXF1aXJlZCA9IHJlcXVpcmVkO1xuICAgICAgICAgIG5leHQuJGJyb2FkY2FzdChcInNjaGVtYUZvcm1WYWxpZGF0ZVwiKTtcbiAgICAgICAgICBmaWVsZFRvV2F0Y2ggKz0gXCJtb2RlbC5cIiArIG5leHQuZm9ybS5rZXkuam9pbignLicpICsgXCImJlwiO1xuICAgICAgICAgIG5leHQgPSBuZXh0LiQkcHJldlNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZmllbGRUb1dhdGNoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmaWVsZFRvV2F0Y2ggPSBmaWVsZFRvV2F0Y2guc3Vic3RyaW5nKDAsIGZpZWxkVG9XYXRjaC5sZW5ndGggLSAyKTtcbiAgICAgICAgfVxuICAgICAgICBzY29wZS5maWVsZFRvV2F0Y2ggPSBmaWVsZFRvV2F0Y2g7XG4gICAgICB9XG4gICAgfVxuXG4gICAgJHNjb3BlLmluaXRJbnRlcm5hbE1vZGVsID0gZnVuY3Rpb24obW9kZWwpe1xuICAgICAgaWYobW9kZWwgJiYgbW9kZWwudHlwZSAmJiBtb2RlbC5uYW1lKSB7XG4gICAgICAgICRzY29wZS5waWNGaWxlID0ge307XG4gICAgICAgICRzY29wZS5waWNGaWxlLnJlc3VsdCA9IG1vZGVsO1xuICAgICAgICAkc2NvcGUucGljRmlsZS5uYW1lID0gbW9kZWwubmFtZTtcbiAgICAgICAgJHNjb3BlLnBpY0ZpbGUucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgICRzY29wZS5waWNGaWxlLnNpemUgPSAwO1xuICAgICAgICAkc2NvcGUucGljRmlsZS50eXBlID0gbW9kZWwudHlwZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gIH1dKVxuICAuZGlyZWN0aXZlKCduZ1NjaGVtYUZpbGUnLCBmdW5jdGlvbigpIHtcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgc2NvcGU6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXI6ICduZ1NjaGVtYUZpbGVDb250cm9sbGVyJyxcbiAgICAgICAgY29udHJvbGxlckFzOiAnZmlsZVVwbG9hZEN0cmwnLFxuICAgICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcbiAgICAgICAgICBzY29wZS5maWxlVXBsb2FkQ3RybC5pbml0KG5nTW9kZWwpO1xuICAgICAgICB9XG4gICAgIH07XG4gIH0pO1xuIixudWxsXX0=
