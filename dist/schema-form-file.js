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
        'maxSize': 'This file is too large ({{file.size / 1000000 | number:1}}MB). Maximum size allowed is {{schema.maxSize}}',
        'mimeType': 'Wrong file type. Allowed types are {{schema.mimeType}}'
      };

      var _defaultMultiFileUploadValidationErrorMessages = {
        'maxSize': _defaultSingleFileUploadValidationErrorMessages.maxSize,
        'mimeType': _defaultSingleFileUploadValidationErrorMessages.mimeType,
        'minItems': 'You have to upload at least {{schema.minItems}} file(s)',
        'maxItems': 'You can\'t upload more than {{schema.maxItems}} file(s).'
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
  'ngMessages',
  'pascalprecht.translate'
])
.controller('ngSchemaFileController', ['$scope', '$log', 'Upload', '$interpolate', '$translate', '$timeout', '$q', '$http', '$window', function ($scope, $log, Upload, $interpolate, $translate, $timeout, $q, $http, $window) {
  var vm = this;
  var ngModel = null;

  var _uploadUrl;

  vm.init = init;

  function init (_ngModel_) {
    ngModel = _ngModel_;

    _uploadUrl = $scope.form && $scope.form.endpoint;
    $scope.isSinglefileUpload = $scope.form && $scope.form.schema && $scope.form.schema.format === 'singlefile';

    $scope.$on('schemaFormValidate', $scope.validateField);
    $scope.$on('schemaFormFileUploadSubmit', $scope.submit);
  }

  $scope.selectFile = function selectFile (file) {
    if (!file) {
      return;
    }
    $scope.picFile = file;

    if ($scope.$$prevSibling && $scope.$$prevSibling.form && $scope.$$prevSibling.form.key.join('.').startsWith($scope.form.key.join('.'))) {
      toggleValidationFileMetadataComponents(true);
      var expr = "evalExpr('" + $scope.fieldToWatch + "',{ model: model, 'arrayIndex': 0, 'modelValue': ''})";
      $scope.removeWatchForRequireMetadata = $scope.$watch(expr, function (value) {
        if (!value) {
          $scope.$broadcast('schemaForm.error.' + $scope.getModelPath().join('.'), 'requireMetadata', null, false);
        } else {
          $scope.$broadcast('schemaForm.error.' + $scope.getModelPath().join('.'), 'requireMetadata', null, true);
        }
      });
    }

    if ($scope.form && $scope.form.autoUploadOnSelect === true) {
      $timeout(function () {
        if (ngModel.$valid) {
          $scope.uploadFile(file);
        } else {
          $log.debug('ngSchemaFileController#selectFile - ngModel is invlid, skip auto upload');
        }
      });
    }
  };

  $scope.selectFiles = function selectFiles (files) {
    $scope.picFiles = files;
  };

  $scope.uploadFile = function uploadFile (file) {
    file && doUpload(file);
  };

  $scope.uploadFiles = function uploadFiles (files) {
    files.length && angular.forEach(files, function (file) {
      doUpload(file);
    });
  };

  $scope.validateField = function validateField () {
    if ($scope.uploadForm.file && $scope.uploadForm.file.$valid && $scope.picFile && !$scope.picFile.$error) {
      // console.log('singlefile-form is invalid');
    } else if ($scope.uploadForm.files && $scope.uploadForm.files.$valid && $scope.picFiles && !$scope.picFiles.$error) {
      // console.log('multifile-form is  invalid');
    } else {
      // console.log('single- and multifile-form are valid');
    }
  };

  $scope.submit = function submit () {
    if ($scope.uploadForm.file && $scope.uploadForm.file.$valid && $scope.picFile && !$scope.picFile.$error) {
      $scope.uploadFile($scope.picFile);
    } else if ($scope.uploadForm.files && $scope.uploadForm.files.$valid && $scope.picFiles && !$scope.picFiles.$error) {
      $scope.uploadFiles($scope.picFiles);
    }
  };

  function toggleValidationFileMetadataComponents (required) {
    var fieldToWatch = '';
    var next = $scope.$$prevSibling;
    while (next && next.form && next.form.key && next.form.key.join('.').startsWith($scope.form.key.join('.'))) {
      next.form.required = required;
      next.$broadcast('schemaFormValidate');
      fieldToWatch += 'model.' + next.form.key.join('.') + '&&';
      next = next.$$prevSibling;
    }
    if (fieldToWatch.length > 0) {
      fieldToWatch = fieldToWatch.substring(0, fieldToWatch.length - 2);
    }
    $scope.fieldToWatch = fieldToWatch;
  }

  function _getFileIdIfAny () {
    var ngModelValue = ngModel.$modelValue;
    if (!ngModelValue) {
      return;
    }

    var primaryKeyPropertyName = ngModelValue.primaryKeyPropertyName;
    if (!primaryKeyPropertyName) {
      return;
    }

    return ngModel.$modelValue[primaryKeyPropertyName];
  }

  $scope.removeFile = function removeFile () {
    if (!$scope.isSinglefileUpload) {
      $log.warn('ngSchemaFileController#removeFile - only support single file at the moment');
      return;
    }

    var id = _getFileIdIfAny();
    if (!id) {
      $log.info('ngSchemaFileController#removeFile - remove the file without remote call due to id is: ' + id);
      doRemove();
    } else {
      $http({
        method: 'DELETE',
        url: _uploadUrl + '/' + id
      }).then(function (response) {
        var succeed = response.data;
        if (succeed) {
          doRemove();
        } else {
          $window.alert('Failed to remove file.');
        }
      }, function (response) {
        $window.alert('An error happened when deleting the file: ' + response.statusText);
        $log.error(response);
      });
    }
  };

  function doRemove () {
    clearErrorMsg();

    if ($scope.picFile && $scope.picFile.result) {
      ngModel.$setViewValue();
      ngModel.$commitViewValue();
    }

    $scope.picFile = null;

    if ($scope.removeWatchForRequireMetadata) {
      $scope.removeWatchForRequireMetadata();
      delete $scope.removeWatchForRequireMetadata;
      $scope.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'requireMetadata', true);
      toggleValidationFileMetadataComponents(false);
    }
  }

  $scope.initInternalModel = function initInternalModel () {
    _syncFileStatus();
  };

  function _doSyncSuccess (model) {
    _mergeDataToNgModelValue(model);
    _updateFileInfo(ngModel.$modelValue);
  }

  function _doSyncError (errorMsg) {
    _mergeDataToNgModelValue({
      status: 'sync_error'
    });
    _updateFileInfo(ngModel.$modelValue);
    setErrorMsg(errorMsg);
  }

  function _mergeDataToNgModelValue (model) {
    if (ngModel.$modelValue) {
      ngModel.$setViewValue(angular.merge(ngModel.$modelValue, model));
    } else {
      ngModel.$setViewValue(model);
    }
    ngModel.$commitViewValue();
  }

  function _updateFileInfo (model) {
    $scope.picFile = {
      result: model,
      name: model.name,
      progress: 100,
      size: angular.isNumber(model.size) ? model.size : undefined,
      type: model.type,
      status: model.status
    };
  }

  function doUpload (file) {
    if (file && !file.$error && _uploadUrl) {
      clearErrorMsg();
      file.upload = Upload.upload({
        url: _uploadUrl,
        file: file,
        data: { metadata: ngModel.$modelValue }
      });

      file.upload.then(function (response) {
        var data = response.data;
        $timeout(function () {
          file.result = data;
        });
        _mergeDataToNgModelValue(data);

        var saveFormAfterUploaded = $scope.form && $scope.form.saveFormAfterUploaded;
        if (saveFormAfterUploaded) {
          $scope.$emit('rdsSchemaFormCtrl.save', {
            source: 'ngSchemaFile',
            file: file,
            form: $scope.form
          });
        }
      }, function (response) {
        if (response.status > 0) {
          setErrorMsg('File Upload Failed!');
          delete file.progress;
        }
      });

      file.upload.progress(function (evt) {
        if ($scope.errorMsg) {
          delete file.progress;
        } else {
          file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        }
      });
    }
  }

  function setErrorMsg (errorMsg) {
    $scope.errorMsg = errorMsg;
  }

  function clearErrorMsg () {
    delete $scope.errorMsg;
  }

  function _syncFileStatus () {
    if (!$scope.isSinglefileUpload) {
      $log.warn('ngSchemaFileController#syncFileStatus - only support single file at the moment');
      return;
    }

    var id = _getFileIdIfAny();
    if (!id) {
      $log.info('ngSchemaFileController#syncFileStatus - skipped due to id is: ' + id);
      return;
    }

    $http({
      method: 'GET',
      url: _uploadUrl + '/' + id
    }).then(function (response) {
      _doSyncSuccess(response.data);
    }).catch(function (response) {
      var errorMsg = 'Failed to get the file info from server: ' + response.statusText;
      $log.error(errorMsg, response);
      _doSyncError(errorMsg);
    });
  }

  $scope.interpValidationMessage = function interpValidationMessage (picFile) {
    if (!picFile) {
      return;
    }

    var error = picFile.$error; // e.g., 'maxSize'
    var form = $scope.form;
    var validationMessage = form.validationMessage;
    var message;
    if (angular.isString(validationMessage)) {
      message = validationMessage;
    } else if (angular.isObject(validationMessage)) {
      message = validationMessage[error];
    }

    if (!message) {
      return error;
    }

    var context = {
      error: error,
      file: picFile,
      form: form,
      schema: form.schema,
      title: form.title || (form.schema && form.schema.title)
    };
    var interpolatedMessage = $interpolate(message)(context);

    return $translate.instant(interpolatedMessage);
  };
}])
.directive('ngSchemaFile', function () {
  return {
    restrict: 'A',
    $scope: true,
    controller: 'ngSchemaFileController',
    controllerAs: 'fileUploadCtrl',
    require: 'ngModel',
    link: function (scope, element, attrs, ngModel) {
      scope.fileUploadCtrl.init(ngModel);
    }
  };
});

angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.html","<ng-form class=\"file-upload mb-lg\" ng-schema-file schema-validate=\"form\" sf-field-model=\"replaceAll\" ng-init=\"initInternalModel()\" ng-model=\"$$value$$\" name=\"uploadForm\">\n  <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\n    {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\n  </label>\n\n  <div ng-show=\"picFile\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n    <div ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.progress.html\'\" class=\"mb\"></div>\n    <div ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.errors.html\'\" class=\"mb\"></div>\n    <span class=\"help-block\" sf-message=\"form.description\"></span>\n  </div>\n\n  <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group\">\n    <li class=\"list-group-item\" ng-repeat=\"picFile in picFiles\">\n      <div ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.progress.html\'\"></div>\n      <div ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.errors.html\'\" class=\"mb\"></div>\n    </li>\n  </ul>\n\n  <div ng-show=\"(isSinglefileUpload && !picFile) || (!isSinglefileUpload && (!picFiles || !picFiles.length))\" class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n    <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\n    <div ng-if=\"isSinglefileUpload\" ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.single.html\'\"></div>\n    <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'directives/decorators/bootstrap/nwp-file/schema-form-file.template.multiple.html\'\"></div>\n    <!--<div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>-->\n    <span class=\"help-block\" sf-message=\"form.description\"></span>\n  </div>\n</ng-form>\n");
$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.template.errors.html","<div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\n  <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ interpValidationMessage(picFile) }}</div>\n  <div class=\"text-danger errorMsg\" ng-message=\"mimeType\">{{ interpValidationMessage(picFile) }}</div>\n  <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ interpValidationMessage(picFile) }}</div>\n  <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ interpValidationMessage(picFile) }}</div>\n  <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{ errorMsg }}</div>\n</div>");
$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.template.multiple.html","<div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\n    ng-model=\"picFiles\" name=\"files\"\n    ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"{{form.schema.mimeType}}\"\n    ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n  <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\n</div>\n<div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n<button ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\n       ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n       ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n       ng-required=\"form.required\"\n       accept=\"{{form.schema.mimeType}}\"\n       ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n       class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n  <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n  {{ \"buttons.add\" | translate }}\n</button>\n");
$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.template.progress.html","<div class=\"row mb\">\n  <div class=\"col-sm-4 mb-sm\">\n     <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.preview\' | translate }}</label>\n     <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\n     <div class=\"img-placeholder\"\n          ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">No preview available\n     </div>\n  </div>\n  <div class=\"col-sm-4 mb-sm\">\n     <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.filename\' | translate }}</label>\n     <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\n  </div>\n  <div class=\"col-sm-4 mb-sm\">\n     <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.progress\' | translate }}</label>\n     <div class=\"progress\">\n        <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\n             ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\n             ng-style=\"{width: picFile.progress + \'%\'}\">\n           {{ picFile.progress }} %\n        </div>\n     </div>\n     <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile)\"\n             ng-disabled=\"ngModel.$error.requireMetadata||!picFile || picFile.result || picFile.$error\">{{ !picFile.result ?  \"buttons.upload\" : \"buttons.uploaded\" | translate }}\n     </button>\n     <button class=\"btn btn-danger btn-sm\" type=\"button\" ng-click=\"removeFile(picFile)\"\n             ng-disabled=\"!picFile\">{{ \"buttons.remove\" | translate }}\n     </button>\n  </div>\n</div>\n");
$templateCache.put("directives/decorators/bootstrap/nwp-file/schema-form-file.template.single.html","<div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\n    ng-model=\"picFile\" name=\"file\"\n    ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"{{form.schema.mimeType}}\"\n    ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n  <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\n</div>\n<div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n<button ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\n       ng-attr-ngf-mimeType=\"{{form.schema.mimeType ? form.schema.mimeType : undefined }}\"\n       ng-attr-ngf-max-size=\"{{form.schema.maxSize ? form.schema.maxSize : undefined }}\"\n       ng-required=\"form.required\"\n       accept=\"{{form.schema.mimeType}}\"\n       ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n       class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n  <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n  {{ \"buttons.add\" | translate }}\n</button>\n");}]);