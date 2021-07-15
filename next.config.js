const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const withTM = require('next-transpile-modules')(['pdfjs-dist'])
const withPlugins = require('next-compose-plugins')

const {
    API_URL,
    REWRITE_API,
    AGGREGATIONS_SPLIT = 1,
    MAX_SEARCH_RETRIES = 1,
    SEARCH_RETRY_DELAY = 3000,
} = process.env

module.exports = withPlugins([ withTM ],
    {
        env: {
            AGGREGATIONS_SPLIT,
            MAX_SEARCH_RETRIES,
            SEARCH_RETRY_DELAY,
        },
        cssModules: false,
        webpack(config, options) {
            config.plugins.push(
                new LodashModuleReplacementPlugin(),
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: './node_modules/pdfjs-dist/cmaps',
                            to: './static/cmaps',
                        },
                        {
                            from: './node_modules/pdfjs-dist/web/images/annotation-*',
                            to: './static/media/annotation/[name].[ext]',
                        },
                    ],
                }),
            );

            config.module.rules.push({
                test: /\.svg$/,
                use: ['@svgr/webpack', 'url-loader'],
            },{
                test: /\.worker\.js$/,
                loader: 'worker-loader',
                options: {
                    filename: 'static/[name].js',
                },
            });

            return config;
        },
        distDir: 'build',
        poweredByHeader: false,
        // TODO on some sunny day, enable
        reactStrictMode: false,
        compress: false,
        redirects: () => [{
            source: '/doc/:collection/:id/raw/:filename',
            destination: '/doc/:collection/:id',
            permanent: true,
        },{
            source: '/doc/:collection/:id/ocr/:tag',
            destination: '/doc/:collection/:id',
            permanent: true,
        }],
        rewrites: () => REWRITE_API ? [{
            source: '/api/v1/whoami',
            destination: API_URL + '/api/v1/whoami',
        },{
            source: '/api/v1/batch',
            destination: API_URL + '/api/v1/batch',
        },{
            source: '/api/v1/collections',
            destination: API_URL + '/api/v1/collections',
        },{
            source: '/api/v1/doc/:collection/:hash/json',
            destination: API_URL + '/api/v1/doc/:collection/:hash/json',
        },{
            source: '/api/v1/doc/:collection/:hash/locations',
            destination: API_URL + '/api/v1/doc/:collection/:hash/locations',
        },{
            source: '/api/v1/doc/:collection/:hash/tags',
            destination: API_URL + '/api/v1/doc/:collection/:hash/tags',
        },{
            source: '/api/v1/doc/:collection/:hash/tags/:id',
            destination: API_URL + '/api/v1/doc/:collection/:hash/tags/:id',
        },{
            source: '/api/v1/doc/:collection/:hash/raw/:filename',
            destination: API_URL + '/api/v1/doc/:collection/:hash/raw/:filename',
        },{
            source: '/api/v1/doc/:collection/:hash/ocr/:tag',
            destination: API_URL + '/api/v1/doc/:collection/:hash/ocr/:tag',
        }] : [],
    }
)
