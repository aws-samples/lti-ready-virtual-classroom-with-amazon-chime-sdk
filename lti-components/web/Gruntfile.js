module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      retire: {
        js: [
          'src/**/*.js',
          'amplify/backend/**/*.js'
        ],
        node: ['.'], /** Which node directories to scan (containing package.json). **/
        options: {
           verbose: true,
           packageOnly: true, 
           outputFile: false
        }
      }
    });
  
    grunt.loadNpmTasks('grunt-retire');
  };