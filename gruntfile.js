module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.initConfig({
    uglify: {
      bindy: {
        options: {
          sourceMap: true
        },
        files: {
          'bindy.min.js': 'bindy.js'
        }
      }
    },
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
  grunt.registerTask('dist', ['mochacov', 'uglify']);
};