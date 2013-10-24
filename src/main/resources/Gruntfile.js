module.exports = function(grunt)
{
  // Project configuration.
  grunt.initConfig(
  {
    pkg: grunt.file.readJSON('package.json'),

    // Plugins configuration
    browserify:
    {
      standalone:
      {
        src:  '<%= pkg.main %>',
        dest: 'dist/<%= pkg.name %>.js',

        options:
        {
          standalone: '<%= pkg.name %>'
        }
      },

      require:
      {
        src:  '<%= pkg.main %>',
        dest: 'dist/<%= pkg.name %>_require.js'
      }
    },

    uglify:
    {
      options:
      {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },

      standalone:
      {
        src:  'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      },

      require:
      {
        src:  'dist/<%= pkg.name %>_require.js',
        dest: 'dist/<%= pkg.name %>_require.min.js'
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'uglify']);
};