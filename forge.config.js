
const path = require('path');

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');


module.exports = {
	packagerConfig: {
		asar: true,
		ignore: [
			'(build|server\.js|player\.js|\.gitignore|README*)',
			'public\/(?!dist|ui|main.css|renderer.js)'
		],
		extraResource: [
			'public/ui/png/app-icon.png',
			'public/ui/ico/app-icon.ico'
		],
		icon: 'public/ui/ico/app-icon'
	},
	rebuildConfig: {},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			platforms: ['win32'],
			config: {
				authors: 'Freetalk Team',
				setupIcon: 'public/ui/ico/app-icon.ico'
			},
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: ['linux'],
		}
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {
				options: {
					icon: 'public/ui/png/app-icon.png'
				}
			},
		},
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};
