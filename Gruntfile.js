module.exports = function(grunt) {

    var mozjpeg = require('imagemin-mozjpeg');
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            js: {
                src: ['//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js', 'js/foundation.min.js', 'js/*.js'],
                dest: 'js/app.min.js'
            }
        },

        imagemin: {
            dynamic: { 
                options: {
                    optimizationLevel: 7,
                    svgoPlugins: [{ removeViewBox: false }],
                    use: [mozjpeg()]
                },                       
                files: [{
                    expand: true,
                    cwd: 'asset/img/_src/',
                    src: ['**/*.{png,jpg,svg}'],
                    dest: 'asset/img/'
                }]
            }
        },

        sass: {
            options: {
                includePaths: ['bower_components/foundation/scss']
                },
            dist: {
                options: {
                    outputStyle: 'compressed'
                },
                files: {
                    'css/app.css': 'scss/app.scss'
                }        
            }
        },

        uglify: {
            js: {
                src: 'js/app.js',
                dest: 'js/app.min.js'
            }
        },
        
        grunticon: {
            myIcons: {
                files: [{
                    expand: true,
                    cwd: 'img/_src/svgs',
                    src: ['*.svg', '*.png'],
                    dest: "img/svgs/optimized"
                }],
                options: {
                }
            }
        },

        sitemap: {
            options: {
                extension: {
                    required: false,
                    trailingSlash: true
                }       
            },
            
            dist: {
                pattern: ['**/*.html', '!**/google*.html'], // this will exclude 'google*.html' 
                siteRoot: 'public/'
            }
        },

        uncss: {
            options: {
                ignore       : [':hover', 'min-width', '.top-bar .expanded',/test\-[0-9]+/],
                //media        : ['(min-width: 0px) handheld and (orientation: landscape)'],
                csspath      : '',
                //raw          : 'h1 { color: green }',
                stylesheets  : ['css/app.css'],
                ignoreSheets : [],
                //urls         : [], // Deprecated
                //timeout      : 1000,
                //htmlroot     : '',
                //report       : 'min'
            },

            dist: {
                files: {
                    'css/app-cleaned.css': ['home-backup.html']
                }
            }
        },

        watch: {
            grunt: { files: ['Gruntfile.js'] },

            sass: {
                files: 'scss/**/*.scss',
                tasks: ['sass']
            }
        }
    });

    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-sitemap');
    grunt.loadNpmTasks('grunt-grunticon');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-uncss');

    grunt.registerTask('build', ['sass']);
    grunt.registerTask('default', ['build', 'watch', 'concat', 'uglify', 'uncss', 'grunticon:myIcons', 'sitemap']);
}