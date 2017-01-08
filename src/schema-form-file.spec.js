describe('schema-form-file-controller', function() {
  // beforeEach(angular.mock.module('schemaForm'));
  beforeEach(angular.mock.module('ngSchemaFormFile'));

  var $controller; // The service that is responsible for instantiating controllers, injected below

  beforeEach(inject(function(_$controller_) { // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
  }));

  it('should have function initInternalModel', function() {
    var $scope = {};
    var ngSchemaFileController = $controller('ngSchemaFileController', {
      $scope: $scope
    });

    expect($scope.initInternalModel).toBeDefined();
  });

});


describe('schema-form-file-directive', function() {
  beforeEach(angular.mock.module('schemaForm'));
  beforeEach(angular.mock.module('ngSchemaFormFile'));

  var $compile,
      $rootScope;

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('should generate a file upload component', function() {
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

    console.log(element);
    console.log(element.html());

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
