'use strict';

const Promise = require('bluebird');

module.exports = (bus, client, transform) => {
	return args => {
		const channel = args.channel;
		const secrets = channel.secrets || {};
		const spec = args.spec;
		const videoId = args.videoId;

		const creds = Object.create(null);
		if (secrets.vimeoAccessToken) {
			creds.accessToken = secrets.vimeoAccessToken;
		}

		const params = Object.assign({videoId}, creds);
		return Promise.join(
			client.getVideo(params),
			client.getVideoConfig(params),
			(video, videoConfig) => {
				if (video) {
					return transform(spec, video, videoConfig);
				}

				const error = new Error(`Video not found for id "${videoId}"`);
				error.code = 'VIDEO_NOT_FOUND';

				bus.broadcast({level: 'error'}, {
					spec,
					error,
					code: error.code,
					message: 'video not found'
				});

				return Promise.reject(error);
			});
	};
};