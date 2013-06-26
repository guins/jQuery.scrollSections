module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    bannerInfo : '* @version <%= pkg.version %>\n' +
            '* @link <%= pkg.url %>\n' + 
            '* @author <%= pkg.author %>\n' +
            '* @author <%= pkg.contributor %>\n' +
            '* @license <%= pkg.license %>\n' +
            '* @copyright (c) 2011-2013, Stéphane Guigné',

    banner: '/*! jQuery ScrollSections\n' +
            '*\n' +
            '<%= pkg.description %>\n' +
            '*\n' +
            '<%= bannerInfo %>\n' +
            '*\n' +
            '* Last modification : <%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '*/\n',

    bannerLight: '/*! jQuery ScrollSections (minified)\n' +
            '<%= bannerInfo %>\n' +
            '*/\n',

    uglify: {
      options: {
        banner: '<%= bannerLight %>'
      },
      build: {
        src: 'src/js/<%= pkg.name %>.js',
        dest: 'build/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
      }
    },

    clean: ["build/js/*", "build/css/*"],

    copy: {
      main: {
        files: [
          {
            src: ['src/js/<%= pkg.name %>.js'], 
            dest: 'build/js/<%= pkg.name %>-<%= pkg.version %>.js', 
            filter: 'isFile'
          }
        ]
      }
    },

    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: '<%= banner %>'
        },
        files: {
          src: [ 'build/js/<%= pkg.name %>-<%= pkg.version %>.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-banner');

  grunt.registerTask('default', []);
  grunt.registerTask('release', ['clean','uglify','copy','usebanner']);
};
