module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.initConfig({
    mochacov: {
      files: ['tests/*.js'],
      options: {
        require: ['expect.js']
      }
    },
    watch: {
      bindy: {
        files: ['gruntfile.js', 'tests/*.js', 'stubs/*.js', 'bindy.js'],
        tasks: ['default']
      }
    }
  });

  grunt.registerTask('default', ['mochacov']);
};