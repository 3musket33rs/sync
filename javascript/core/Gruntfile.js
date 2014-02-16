module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    jshint : {
      options : {
        curly : true,
        bitwise : false,
        camelcase : true,
        eqeqeq : true,
        forin : true,
        immed : true,
        latedef : true,
        newcap : true,
        noarg : true,
        noempty : true,
        typed : true,
        nonew : true,
        plusplus : false,
        indent : 2,
        undef : true,
        quotmark : 'single',
        unused : true,
        strict : true,
        trailing : true,
        esnext : true,
        globals : {
          require : false,
          module : true,
          describe : false,
          it : false,
          before : false
        }
      },
      all : [ 'Gruntfile.js', 'src/**/*.js', 'test/**/*.js' ]
    },
    jsdoc : {
      dist : {
        src: [ 'src/*.js', 'README.md' ],
        options: {
          destination: 'apidocs'
        }
      }
    },
    browserify : {
      dist  : {
        files: {
          'browser/browser.js': 'src/**/*.js'
        }
      }
    },
    clean: ['apidocs/**']
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['clean', 'jshint', 'jsdoc', 'browserify']);
};