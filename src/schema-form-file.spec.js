describe('The schema-form-file plugin', function() {
  beforeEach(angular.mock.module('schemaForm'));
  beforeEach(angular.mock.module('ngSchemaFormFile'));

  var $compile,
      $rootScope;

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('can generate a file upload component in an angular-schema-form', function() {
    var $scope = $rootScope.$new();
    $scope.form = [{
      "key": "test-file-key",
      "type": "nwpFileUpload",
      "title": "Single File Upload",
      "endpoint": "http://localhost:9999/schemaformbuilder/attachment/upload"
    }];

    $scope.schema = {
      "type": "object",
      "properties": {
        "file": {
          "type": "object",
          "format": "singlefile",
          "pattern": {
            "mimeType": "*"
          },
          "maxSize": {
            "maximum": "2MB",
            "validationMessage": "File size should be no larger than 2MB"
          },
          "maxItems": {
            "validationMessage": ""
          },
          "minItems": {
            "validationMessage": ""
          },
          "properties": {}
        }
      }
    }

    $scope.model = {};

    var element = $compile('<form sf-schema="schema" sf-form="form" sf-model="model"></form>')($scope);
    $rootScope.$apply();

    expect(element.children().length).toBe(1);
    expect(element.html()).toContain("schema-form-nwpFileUpload");

    // tmpl.children().length.should.be.equal(2);
    // tmpl.children().eq(0).is('div.form-group').should.be.true;
    // tmpl.children().eq(0).find('input').is('input[type="text"]').should.be.true;
    // tmpl.children().eq(0).find('input').attr('ng-model').should.be.equal('model[\'name\']');
    // tmpl.children().eq(0).is('div.form-group').should.be.true;
    // tmpl.children().eq(1).children('select').length.should.equal(1);
  });
});

describe('schema-form-file\'s ngSchemaFileController', function() {
  // beforeEach(angular.mock.module('schemaForm'));
  beforeEach(angular.mock.module('ngSchemaFormFile'));

  var $compile,
      $controller,
      $rootScope,
      $httpBackend;

  beforeEach(inject(function(_$compile_, _$controller_, _$rootScope_, _$httpBackend_) { // The injector unwraps the underscores (_) from around the parameter names when matching
    $compile = _$compile_;
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function() {
     $httpBackend.verifyNoOutstandingExpectation();
     $httpBackend.verifyNoOutstandingRequest();
  });

  it('can upload', function() {
    var $scope = $rootScope.$new();
    $scope.form = {
      endpoint: 'http://noSuchPoint-JustForTest.com/upload',
      saveFormAfterUploaded: true
    };

    var saveEventFired = false;
    $rootScope.$on('rdsSchemaFormCtrl.save', function() {
      saveEventFired = true;
    });

    var expectedResponse = {
      "id": "1",
      "name": "testFile.png",
      "type": "image/png"
    }

    $httpBackend.whenPOST($scope.form.endpoint).respond(200, expectedResponse);
    // var mockFileToUpload = {"name": "1.html", "size": 1024, "type": "text/html"};
    var blob = new Blob([""], { type: 'text/html' });
    blob["lastModifiedDate"] = "";
    blob["name"] = "1.html";
    var mockFileToUpload = blob;

    var ngSchemaFileController = $controller('ngSchemaFileController', {$scope: $scope});
    var ngModelController = $compile('<input ng-model="dummy">')($rootScope.$new()).controller('ngModel'); // A workaround for NgModelController can't be instantiated by $controller in mock tests.
    ngSchemaFileController.init(ngModelController);

    $scope.uploadFile(mockFileToUpload);
    $httpBackend.expectPOST($scope.form.endpoint).respond('200');
    $httpBackend.flush();

    expect($scope.initInternalModel).toBeDefined();
    expect($scope.selectFile).toBeDefined();
    expect($scope.uploadFile).toBeDefined();
    expect(saveEventFired).toBe(true);
  });

  // it('can $emit a "rdsSchemaFormCtrl.save" event if form.autoSaveAfterUploaded is true', function() {
    
  // });

});

describe('ngSchemaFile directive', function() {
  beforeEach(angular.mock.module('schemaForm'));
  beforeEach(angular.mock.module('ngSchemaFormFile'));

  var $compile,
      $rootScope;

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('can generate a proper child scope', function() {
    var $scope = $rootScope.$new();
    $scope.testModel = {};

    var element = $compile('<ng-form class="file-upload mb-lg" ng-schema-file ng-model="testModel" ng-init="initInternalModel(testModel)" ng-model="testModel" name="uploadForm">')($scope);

    var childScopeCreated = element.scope();
    expect(childScopeCreated.$parent).toBe($scope);
    expect(childScopeCreated.selectFile).toBeDefined();
  });
});

