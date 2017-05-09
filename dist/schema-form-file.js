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
      var _defaultSingleFileUploadValidationErrorMessages = {
        'mimeType': 'Wrong file type. Allowed types are ',
        'maxSize': 'This file is too large. Maximum size allowed is '
      };
      var _defaultMultiFileUploadValidationErrorMessages = {
        'mimeType': 'Wrong file type. Allowed types are ',
        'maxSize': 'This file is too large. Maximum size allowed is ',
        'minItems': 'You have to upload at least one file',
        'maxItems': 'You can\'t upload more than one file.'
      };

      function _applyDefaultValidationErrorMessages (form, schema, messagesObject) {
        form.validationMessage = form.validationMessage || {};
        for (var keyword in messagesObject) {
          if (schema[keyword] && !form.validationMessage[keyword]) {
            form.validationMessage[keyword] = messagesObject[keyword];
          }
        }
      }

      function registerDefaultTypes () {
        function nwpSinglefileUploadDefaultProvider (name, schema, options) {
          if (schema.type === 'object' && schema.format === 'singlefile') {
            var f = schemaFormProvider.stdFormObj(name, schema, options);
            f.key = options.path;
            f.type = 'nwpFileUpload';
            options.lookup[sfPathProvider.stringify(options.path)] = f;
            _applyDefaultValidationErrorMessages(f, schema, _defaultSingleFileUploadValidationErrorMessages);
            return f;
          }
        }

        function nwpMultifileUploadDefaultProvider (name, schema, options) {
          if (schema.type === 'array' && schema.format === 'multifile') {
            var f = schemaFormProvider.stdFormObj(name, schema, options);
            f.key = options.path;
            f.type = 'nwpFileUpload';
            options.lookup[sfPathProvider.stringify(options.path)] = f;
            _applyDefaultValidationErrorMessages(f, schema, _defaultMultiFileUploadValidationErrorMessages);
            return f;
          }
        }

        schemaFormProvider.defaults.array.unshift(nwpSinglefileUploadDefaultProvider);
        schemaFormProvider.defaults.array.unshift(nwpMultifileUploadDefaultProvider);
      }

      registerDefaultTypes();

      schemaFormDecoratorsProvider.defineAddOn(
            'bootstrapDecorator',
            'nwpFileUpload',
            'directives/decorators/bootstrap/nwp-file/schema-form-file.html',
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
          data: {metadata: ngModel.$modelValue}
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

angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.html","<ng-form class=\"file-upload mb-lg\" ng-schema-file schema-validate=\"form\" sf-field-model=\"replaceAll\" ng-init=\"initInternalModel($$value$$)\" ng-model=\"$$value$$\" name=\"uploadForm\">\n   <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\n      {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\n   </label>\n\n   <div ng-show=\"picFile\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <div ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.progress.html\'\" class=\"mb\"></div>\n	  <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n\n   <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group\">\n      <li class=\"list-group-item\" ng-repeat=\"picFile in picFiles\">\n         <div ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.progress.html\'\"></div>\n      </li>\n   </ul>\n\n   <div ng-show=\"(isSinglefileUpload && !picFile) || (!isSinglefileUpload && (!picFiles || !picFiles.length))\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n      <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\n      <div ng-if=\"isSinglefileUpload\" ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.single.html\'\"></div>\n      <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.multiple.html\'\"></div>\n      <!--<div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>-->\n      <span class=\"help-block\" sf-message=\"form.description\"></span>\n   </div>\n</ng-form>\n");
$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.template.multiple.html","<div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\n    ng-model=\"picFiles\" name=\"files\"\n    ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"{{form.schema.mimeType}}\"\n    ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n  <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\n</div>\n<div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n<button ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\n       accept=\"{{form.schema.mimeType}}\"\n       ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n       ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n       ng-required=\"form.required\"\n       ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n       class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n  <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n  {{ \"buttons.add\" | translate }}\n</button>\n");
$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.template.progress.html","<div class=\"row mb\">\n  <div class=\"col-sm-4 mb-sm\">\n     <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.preview\' | translate }}</label>\n     <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\n     <div class=\"img-placeholder\"\n          ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">No preview\n        available\n     </div>\n  </div>\n  <div class=\"col-sm-4 mb-sm\">\n     <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.filename\' | translate }}</label>\n     <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\n  </div>\n  <div class=\"col-sm-4 mb-sm\">\n     <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.progress\' | translate }}</label>\n     <div class=\"progress\">\n        <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\n             ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\n             ng-style=\"{width: picFile.progress + \'%\'}\">\n           {{ picFile.progress }} %\n        </div>\n     </div>\n     <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile)\"\n             ng-disabled=\"ngModel.$error.requireMetadata||!picFile || picFile.result || picFile.$error\">{{ !picFile.result ?  \"buttons.upload\" : \"buttons.uploaded\" | translate }}\n     </button>\n     <button class=\"btn btn-danger btn-sm\" type=\"button\" ng-click=\"removeFile(picFile)\"\n             ng-disabled=\"!picFile || picFile.$error\">{{ \"buttons.remove\" | translate }}\n     </button>\n  </div>\n</div>\n<div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\n  <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ form.validationMessage[picFile.$error] | translate }} <strong>{{picFile.$errorParam}}</strong>. (<strong>{{picFile.size / 1000000|number:1}}MB</strong>)</div>\n  <div class=\"text-danger errorMsg\" ng-message=\"mimeType\">{{ form.validationMessage[picFile.$error] | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n  <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ form.validationMessage[picFile.$error] | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n  <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ form.validationMessage[picFile.$error] | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n  <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{errorMsg}}</div>\n</div>\n");
$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.template.single.html","<div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\n    ng-model=\"picFile\" name=\"file\"\n    ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"{{form.schema.mimeType}}\"\n    ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n  <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\n</div>\n<div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n<button ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\n       ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n       ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n       ng-required=\"form.required\"\n       accept=\"{{form.schema.mimeType}}\"\n       ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n       class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n  <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n  {{ \"buttons.add\" | translate }}\n</button>\n");}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OEVDN09BO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InNjaGVtYS1mb3JtLWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXJcbiAgLm1vZHVsZSgnc2NoZW1hRm9ybScpXG4gIC5jb25maWcoWydzY2hlbWFGb3JtUHJvdmlkZXInLCAnc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlcicsICdzZlBhdGhQcm92aWRlcicsICdzZkJ1aWxkZXJQcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKHNjaGVtYUZvcm1Qcm92aWRlciwgc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlciwgc2ZQYXRoUHJvdmlkZXIsIHNmQnVpbGRlclByb3ZpZGVyKSB7XG4gICAgICB2YXIgX2RlZmF1bHRTaW5nbGVGaWxlVXBsb2FkVmFsaWRhdGlvbkVycm9yTWVzc2FnZXMgPSB7XG4gICAgICAgICdtaW1lVHlwZSc6ICdXcm9uZyBmaWxlIHR5cGUuIEFsbG93ZWQgdHlwZXMgYXJlICcsXG4gICAgICAgICdtYXhTaXplJzogJ1RoaXMgZmlsZSBpcyB0b28gbGFyZ2UuIE1heGltdW0gc2l6ZSBhbGxvd2VkIGlzICdcbiAgICAgIH07XG4gICAgICB2YXIgX2RlZmF1bHRNdWx0aUZpbGVVcGxvYWRWYWxpZGF0aW9uRXJyb3JNZXNzYWdlcyA9IHtcbiAgICAgICAgJ21pbWVUeXBlJzogJ1dyb25nIGZpbGUgdHlwZS4gQWxsb3dlZCB0eXBlcyBhcmUgJyxcbiAgICAgICAgJ21heFNpemUnOiAnVGhpcyBmaWxlIGlzIHRvbyBsYXJnZS4gTWF4aW11bSBzaXplIGFsbG93ZWQgaXMgJyxcbiAgICAgICAgJ21pbkl0ZW1zJzogJ1lvdSBoYXZlIHRvIHVwbG9hZCBhdCBsZWFzdCBvbmUgZmlsZScsXG4gICAgICAgICdtYXhJdGVtcyc6ICdZb3UgY2FuXFwndCB1cGxvYWQgbW9yZSB0aGFuIG9uZSBmaWxlLidcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIF9hcHBseURlZmF1bHRWYWxpZGF0aW9uRXJyb3JNZXNzYWdlcyAoZm9ybSwgc2NoZW1hLCBtZXNzYWdlc09iamVjdCkge1xuICAgICAgICBmb3JtLnZhbGlkYXRpb25NZXNzYWdlID0gZm9ybS52YWxpZGF0aW9uTWVzc2FnZSB8fCB7fTtcbiAgICAgICAgZm9yICh2YXIga2V5d29yZCBpbiBtZXNzYWdlc09iamVjdCkge1xuICAgICAgICAgIGlmIChzY2hlbWFba2V5d29yZF0gJiYgIWZvcm0udmFsaWRhdGlvbk1lc3NhZ2Vba2V5d29yZF0pIHtcbiAgICAgICAgICAgIGZvcm0udmFsaWRhdGlvbk1lc3NhZ2Vba2V5d29yZF0gPSBtZXNzYWdlc09iamVjdFtrZXl3b3JkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVnaXN0ZXJEZWZhdWx0VHlwZXMgKCkge1xuICAgICAgICBmdW5jdGlvbiBud3BTaW5nbGVmaWxlVXBsb2FkRGVmYXVsdFByb3ZpZGVyIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdvYmplY3QnICYmIHNjaGVtYS5mb3JtYXQgPT09ICdzaW5nbGVmaWxlJykge1xuICAgICAgICAgICAgdmFyIGYgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgICAgZi5rZXkgPSBvcHRpb25zLnBhdGg7XG4gICAgICAgICAgICBmLnR5cGUgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgICBvcHRpb25zLmxvb2t1cFtzZlBhdGhQcm92aWRlci5zdHJpbmdpZnkob3B0aW9ucy5wYXRoKV0gPSBmO1xuICAgICAgICAgICAgX2FwcGx5RGVmYXVsdFZhbGlkYXRpb25FcnJvck1lc3NhZ2VzKGYsIHNjaGVtYSwgX2RlZmF1bHRTaW5nbGVGaWxlVXBsb2FkVmFsaWRhdGlvbkVycm9yTWVzc2FnZXMpO1xuICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gbndwTXVsdGlmaWxlVXBsb2FkRGVmYXVsdFByb3ZpZGVyIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdhcnJheScgJiYgc2NoZW1hLmZvcm1hdCA9PT0gJ211bHRpZmlsZScpIHtcbiAgICAgICAgICAgIHZhciBmID0gc2NoZW1hRm9ybVByb3ZpZGVyLnN0ZEZvcm1PYmoobmFtZSwgc2NoZW1hLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGYua2V5ID0gb3B0aW9ucy5wYXRoO1xuICAgICAgICAgICAgZi50eXBlID0gJ253cEZpbGVVcGxvYWQnO1xuICAgICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICAgIF9hcHBseURlZmF1bHRWYWxpZGF0aW9uRXJyb3JNZXNzYWdlcyhmLCBzY2hlbWEsIF9kZWZhdWx0TXVsdGlGaWxlVXBsb2FkVmFsaWRhdGlvbkVycm9yTWVzc2FnZXMpO1xuICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwU2luZ2xlZmlsZVVwbG9hZERlZmF1bHRQcm92aWRlcik7XG4gICAgICAgIHNjaGVtYUZvcm1Qcm92aWRlci5kZWZhdWx0cy5hcnJheS51bnNoaWZ0KG53cE11bHRpZmlsZVVwbG9hZERlZmF1bHRQcm92aWRlcik7XG4gICAgICB9XG5cbiAgICAgIHJlZ2lzdGVyRGVmYXVsdFR5cGVzKCk7XG5cbiAgICAgIHNjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXIuZGVmaW5lQWRkT24oXG4gICAgICAgICAgICAnYm9vdHN0cmFwRGVjb3JhdG9yJyxcbiAgICAgICAgICAgICdud3BGaWxlVXBsb2FkJyxcbiAgICAgICAgICAgICdkaXJlY3RpdmVzL2RlY29yYXRvcnMvYm9vdHN0cmFwL253cC1maWxlL3NjaGVtYS1mb3JtLWZpbGUuaHRtbCcsXG4gICAgICAgICAgICAvLyBkZWZhdWx0c1xuICAgICAgICAgICAgc2ZCdWlsZGVyUHJvdmlkZXIuc3RkQnVpbGRlcnNcbiAgICAgICAgKTtcbiAgICB9XG4gIF0pO1xuXG5hbmd1bGFyXG4ubW9kdWxlKCduZ1NjaGVtYUZvcm1GaWxlJywgW1xuICAnbmdGaWxlVXBsb2FkJyxcbiAgJ25nTWVzc2FnZXMnXG5dKVxuLmNvbnRyb2xsZXIoJ25nU2NoZW1hRmlsZUNvbnRyb2xsZXInLCBbJyRzY29wZScsICdVcGxvYWQnLCAnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbiAoJHNjb3BlLCBVcGxvYWQsICR0aW1lb3V0LCAkcSkge1xuICB2YXIgdm0gPSB0aGlzO1xuXG4gIHZhciBzY29wZSA9IG51bGwsXG4gICAgbmdNb2RlbCA9IG51bGw7XG5cbiAgdm0uaW5pdCA9IGluaXQ7XG5cbiAgZnVuY3Rpb24gaW5pdCAoX25nTW9kZWxfKSB7XG4gICAgbmdNb2RlbCA9IF9uZ01vZGVsXztcbiAgICBzY29wZSA9ICRzY29wZTtcblxuICAgIHNjb3BlLnVybCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5lbmRwb2ludDtcbiAgICBzY29wZS5pc1NpbmdsZWZpbGVVcGxvYWQgPSBzY29wZS5mb3JtICYmIHNjb3BlLmZvcm0uc2NoZW1hICYmIHNjb3BlLmZvcm0uc2NoZW1hLmZvcm1hdCA9PT0gJ3NpbmdsZWZpbGUnO1xuXG4gICAgc2NvcGUuc2VsZWN0RmlsZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2NvcGUucGljRmlsZSA9IGZpbGU7XG5cbiAgICAgIGlmIChzY29wZS4kJHByZXZTaWJsaW5nICYmIHNjb3BlLiQkcHJldlNpYmxpbmcuZm9ybSAmJiBzY29wZS4kJHByZXZTaWJsaW5nLmZvcm0ua2V5LmpvaW4oJy4nKS5zdGFydHNXaXRoKHNjb3BlLmZvcm0ua2V5LmpvaW4oJy4nKSkpIHtcbiAgICAgICAgdG9nZ2xlVmFsaWRhdGlvbkZpbGVNZXRhZGF0YUNvbXBvbmVudHModHJ1ZSk7XG4gICAgICAgIHZhciBleHByID0gXCJldmFsRXhwcignXCIgKyBzY29wZS5maWVsZFRvV2F0Y2ggKyBcIicseyBtb2RlbDogbW9kZWwsICdhcnJheUluZGV4JzogMCwgJ21vZGVsVmFsdWUnOiAnJ30pXCI7XG4gICAgICAgIHNjb3BlLnJlbW92ZVdhdGNoRm9yUmVxdWlyZU1ldGFkYXRhID0gc2NvcGUuJHdhdGNoKGV4cHIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIHNjb3BlLiRicm9hZGNhc3QoJ3NjaGVtYUZvcm0uZXJyb3IuJyArIHNjb3BlLmdldE1vZGVsUGF0aCgpLmpvaW4oJy4nKSwgJ3JlcXVpcmVNZXRhZGF0YScsIG51bGwsIGZhbHNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuJGJyb2FkY2FzdCgnc2NoZW1hRm9ybS5lcnJvci4nICsgc2NvcGUuZ2V0TW9kZWxQYXRoKCkuam9pbignLicpLCAncmVxdWlyZU1ldGFkYXRhJywgbnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgc2NvcGUuc2VsZWN0RmlsZXMgPSBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgIHNjb3BlLnBpY0ZpbGVzID0gZmlsZXM7XG4gICAgfTtcblxuICAgIHNjb3BlLnVwbG9hZEZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgZmlsZSAmJiBkb1VwbG9hZChmaWxlKTtcbiAgICB9O1xuXG4gICAgc2NvcGUudXBsb2FkRmlsZXMgPSBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgIGZpbGVzLmxlbmd0aCAmJiBhbmd1bGFyLmZvckVhY2goZmlsZXMsIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIGRvVXBsb2FkKGZpbGUpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIGtlbGluOiBoYW5kbGVyIGZvciB0aGUgcmVtb3ZlIGFjdGlvbi5cbiAgICAvLyBUT0RPOiBOZWVkIHRvIGNvbW11bmljYXRlIHdpdGggc2VydmVyIGZvciBkZWxldGlvbiBpZiB0aGUgZmlsZSBpcyBhbHJlYWR5IHVwbG9hZGVkLlxuICAgIHNjb3BlLnJlbW92ZUZpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2NvcGUuaXNTaW5nbGVmaWxlVXBsb2FkKSB7XG4gICAgICAgIGlmIChzY29wZS5waWNGaWxlICYmIHNjb3BlLnBpY0ZpbGUucmVzdWx0KSB7ICAvLyBBbHJlYWR5IHVwbG9hZGVkIGZpbGUsIHJlbW92ZSB0aGUgd2hvbGUgZmlsZSBvYmplY3QgaW5jbHVkaW5nIGZpbGUgbWV0YWRhdGFzXG4gICAgICAgICAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKCk7XG4gICAgICAgICAgbmdNb2RlbC4kY29tbWl0Vmlld1ZhbHVlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5waWNGaWxlID0gbnVsbDtcblxuICAgICAgICBpZiAoc2NvcGUucmVtb3ZlV2F0Y2hGb3JSZXF1aXJlTWV0YWRhdGEpIHtcbiAgICAgICAgICBzY29wZS5yZW1vdmVXYXRjaEZvclJlcXVpcmVNZXRhZGF0YSgpO1xuICAgICAgICAgIGRlbGV0ZSBzY29wZS5yZW1vdmVXYXRjaEZvclJlcXVpcmVNZXRhZGF0YTtcbiAgICAgICAgICBzY29wZS4kYnJvYWRjYXN0KCdzY2hlbWFGb3JtLmVycm9yLicgKyBzY29wZS5mb3JtLmtleS5qb2luKCcuJyksICdyZXF1aXJlTWV0YWRhdGEnLCB0cnVlKTtcbiAgICAgICAgICB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyhmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7fVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkb1VwbG9hZCAoZmlsZSkge1xuICAgICAgaWYgKGZpbGUgJiYgIWZpbGUuJGVycm9yICYmIHNjb3BlLnVybCkge1xuICAgICAgICBmaWxlLnVwbG9hZCA9IFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgIHVybDogc2NvcGUudXJsLFxuICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgZGF0YToge21ldGFkYXRhOiBuZ01vZGVsLiRtb2RlbFZhbHVlfVxuICAgICAgICB9KTtcblxuICAgICAgICBmaWxlLnVwbG9hZC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZpbGUucmVzdWx0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAobmdNb2RlbC4kbW9kZWxWYWx1ZSkge1xuICAgICAgICAgICAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKGFuZ3VsYXIubWVyZ2UobmdNb2RlbC4kbW9kZWxWYWx1ZSwgcmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5nTW9kZWwuJGNvbW1pdFZpZXdWYWx1ZSgpO1xuXG4gICAgICAgICAgdmFyIHNhdmVGb3JtQWZ0ZXJVcGxvYWRlZCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5zYXZlRm9ybUFmdGVyVXBsb2FkZWQ7XG4gICAgICAgICAgaWYgKHNhdmVGb3JtQWZ0ZXJVcGxvYWRlZCkge1xuICAgICAgICAgICAgc2NvcGUuJGVtaXQoJ3Jkc1NjaGVtYUZvcm1DdHJsLnNhdmUnLCB7XG4gICAgICAgICAgICAgIHNvdXJjZTogJ25nU2NoZW1hRmlsZScsXG4gICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgIGZvcm06IHNjb3BlLmZvcm1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+IDApIHtcbiAgICAgICAgICAgIHNjb3BlLmVycm9yTXNnID0gcmVzcG9uc2Uuc3RhdHVzICsgJzogJyArIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBmaWxlLnVwbG9hZC5wcm9ncmVzcyhmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IE1hdGgubWluKDEwMCwgcGFyc2VJbnQoMTAwLjAgKiBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNjb3BlLnZhbGlkYXRlRmllbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2NvcGUudXBsb2FkRm9ybS5maWxlICYmIHNjb3BlLnVwbG9hZEZvcm0uZmlsZS4kdmFsaWQgJiYgc2NvcGUucGljRmlsZSAmJiAhc2NvcGUucGljRmlsZS4kZXJyb3IpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3NpbmdsZWZpbGUtZm9ybSBpcyBpbnZhbGlkJyk7XG4gICAgICB9IGVsc2UgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlcy4kdmFsaWQgJiYgc2NvcGUucGljRmlsZXMgJiYgIXNjb3BlLnBpY0ZpbGVzLiRlcnJvcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnbXVsdGlmaWxlLWZvcm0gaXMgIGludmFsaWQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdzaW5nbGUtIGFuZCBtdWx0aWZpbGUtZm9ybSBhcmUgdmFsaWQnKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZSAmJiBzY29wZS51cGxvYWRGb3JtLmZpbGUuJHZhbGlkICYmIHNjb3BlLnBpY0ZpbGUgJiYgIXNjb3BlLnBpY0ZpbGUuJGVycm9yKSB7XG4gICAgICAgIHNjb3BlLnVwbG9hZEZpbGUoc2NvcGUucGljRmlsZSk7XG4gICAgICB9IGVsc2UgaWYgKHNjb3BlLnVwbG9hZEZvcm0uZmlsZXMgJiYgc2NvcGUudXBsb2FkRm9ybS5maWxlcy4kdmFsaWQgJiYgc2NvcGUucGljRmlsZXMgJiYgIXNjb3BlLnBpY0ZpbGVzLiRlcnJvcikge1xuICAgICAgICBzY29wZS51cGxvYWRGaWxlcyhzY29wZS5waWNGaWxlcyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNjb3BlLiRvbignc2NoZW1hRm9ybVZhbGlkYXRlJywgc2NvcGUudmFsaWRhdGVGaWVsZCk7XG4gICAgc2NvcGUuJG9uKCdzY2hlbWFGb3JtRmlsZVVwbG9hZFN1Ym1pdCcsIHNjb3BlLnN1Ym1pdCk7XG5cbiAgICBmdW5jdGlvbiB0b2dnbGVWYWxpZGF0aW9uRmlsZU1ldGFkYXRhQ29tcG9uZW50cyAocmVxdWlyZWQpIHtcbiAgICAgIHZhciBmaWVsZFRvV2F0Y2ggPSAnJztcbiAgICAgIHZhciBuZXh0ID0gc2NvcGUuJCRwcmV2U2libGluZztcbiAgICAgIHdoaWxlIChuZXh0ICYmIG5leHQuZm9ybSAmJiBuZXh0LmZvcm0ua2V5ICYmIG5leHQuZm9ybS5rZXkuam9pbignLicpLnN0YXJ0c1dpdGgoc2NvcGUuZm9ybS5rZXkuam9pbignLicpKSkge1xuICAgICAgICBuZXh0LmZvcm0ucmVxdWlyZWQgPSByZXF1aXJlZDtcbiAgICAgICAgbmV4dC4kYnJvYWRjYXN0KCdzY2hlbWFGb3JtVmFsaWRhdGUnKTtcbiAgICAgICAgZmllbGRUb1dhdGNoICs9ICdtb2RlbC4nICsgbmV4dC5mb3JtLmtleS5qb2luKCcuJykgKyAnJiYnO1xuICAgICAgICBuZXh0ID0gbmV4dC4kJHByZXZTaWJsaW5nO1xuICAgICAgfVxuICAgICAgaWYgKGZpZWxkVG9XYXRjaC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZpZWxkVG9XYXRjaCA9IGZpZWxkVG9XYXRjaC5zdWJzdHJpbmcoMCwgZmllbGRUb1dhdGNoLmxlbmd0aCAtIDIpO1xuICAgICAgfVxuICAgICAgc2NvcGUuZmllbGRUb1dhdGNoID0gZmllbGRUb1dhdGNoO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5pbml0SW50ZXJuYWxNb2RlbCA9IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgIGlmIChtb2RlbCAmJiBtb2RlbC50eXBlICYmIG1vZGVsLm5hbWUpIHtcbiAgICAgICRzY29wZS5waWNGaWxlID0ge307XG4gICAgICAkc2NvcGUucGljRmlsZS5yZXN1bHQgPSBtb2RlbDtcbiAgICAgICRzY29wZS5waWNGaWxlLm5hbWUgPSBtb2RlbC5uYW1lO1xuICAgICAgJHNjb3BlLnBpY0ZpbGUucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAkc2NvcGUucGljRmlsZS5zaXplID0gMDtcbiAgICAgICRzY29wZS5waWNGaWxlLnR5cGUgPSBtb2RlbC50eXBlO1xuICAgIH1cbiAgfTtcbn1dKVxuLmRpcmVjdGl2ZSgnbmdTY2hlbWFGaWxlJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgc2NvcGU6IHRydWUsXG4gICAgY29udHJvbGxlcjogJ25nU2NoZW1hRmlsZUNvbnRyb2xsZXInLFxuICAgIGNvbnRyb2xsZXJBczogJ2ZpbGVVcGxvYWRDdHJsJyxcbiAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbCkge1xuICAgICAgc2NvcGUuZmlsZVVwbG9hZEN0cmwuaW5pdChuZ01vZGVsKTtcbiAgICB9XG4gIH07XG59KTtcbiIsbnVsbF19
