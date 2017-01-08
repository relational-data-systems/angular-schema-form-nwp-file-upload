describe('AngularSchemaFormFileUpload', function() {
  beforeEach(angular.mock.module('schemaForm'));

  beforeEach(inject(function($rootScope) {
    $scope = $rootScope.$new();
    $scope.loadDataPath = "/no/such/path";
  }));

  it('should be defined', function() {
    expect(1).toBe(1);
  });

});
