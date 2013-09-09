beforeEach(function() {
  this.addMatchers({
    toBeLessThan: function(expected) {
      return this.actual < expected;
    },
    toHaveAllValuesInRange: function (low, high) {
        for (var idx = 0; idx < this.actual.length; idx += 1) {
            if (this.actual[idx] < low || this.actual[idx] > high) {
                return false;
            }
        }
        return true;
    }
  });
});

function setIfUndefined(variable, defaultValue) {
    variable = (typeof variable === "undefined") ? defaultValue : variable;
    return variable;
}
