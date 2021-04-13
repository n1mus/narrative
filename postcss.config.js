module.exports = {
    processors: [
        // add vendor prefixes
        require('autoprefixer')(),
        // minify
        require('cssnano')([
            'default',
            {
                normalizeWhitespace: {
                    exclude: true,
                },
            },
        ]),
    ],
};
