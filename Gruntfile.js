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

    bannerCss : '/* ----------------------------------------------------------------------------\n\n' +
            '<%= pkg.fullname %>\n\n' +
            '<%= bannerInfo %>\n\n' +
            '---------------------------------------------------------------------------- */\n',

    banner: '/*! <%= pkg.fullname %>\n' +
            '*\n' +
            '<%= pkg.description %>\n' +
            '*\n' +
            '<%= bannerInfo %>\n' +
            '*\n' +
            '* Last modification : <%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '*\n' +
            '*/\n',

    bannerLight: '/*! <%= pkg.fullname %> (minified)\n' +
            '<%= bannerInfo %>\n' +
            '*/\n',

    watch: {
     scripts: {
     files: ['src/less/*.less'],
      tasks: ['less:watch'],
       options: {
         nospawn: true,
       }
     }
    },

    less: {
      watch: {
        files: {
          "src/css/<%= pkg.name %>.css": "src/less/<%= pkg.name %>.less"
        }
      },
      development: {
        files: {
          "build/css/<%= pkg.name %>-<%= pkg.version %>.css": "src/less/<%= pkg.name %>.less",
        }
      },
      production: {
        options: {
          yuicompress: true
        },
        files: {
          "build/css/<%= pkg.name %>-<%= pkg.version %>.min.css": "src/less/<%= pkg.name %>.less",
        }
      }
    },

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
      addtoJs: {
        options: {
          position: 'top',
          banner: '<%= banner %>'
        },
        files: {
          src: [ 'build/js/<%= pkg.name %>-<%= pkg.version %>.js']
        }
      },
      addtoCss: {
        options: {
          position: 'top',
          banner: '<%= bannerCss %>'
        },
        files: {
          src: [ 
            'build/css/<%= pkg.name %>-<%= pkg.version %>.css',
            'build/css/<%= pkg.name %>-<%= pkg.version %>.min.css'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-banner');

  grunt.registerTask('release', ['clean','less','uglify','copy','usebanner']);
};
