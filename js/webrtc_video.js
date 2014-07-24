WebRtcVideo = function (containerEl, callback) {  
    this.videoEl_ = this.createVideoElement(containerEl);
    var sourcesCallback = function(video_sources) {
        if (video_sources.length>0) {
            var videoSourceId = video_sources[video_sources.length-1];
            this.initWebRtcVideo(callback, videoSourceId);
        } else {
            this.initWebRtcVideo(callback);
        }
    }
    this.queryVideoSources(sourcesCallback.bind(this));
}

WebRtcVideo.VIDEO_WIDTH = 640;

WebRtcVideo.VIDEO_HEIGHT = 480;

WebRtcVideo.prototype.createVideoElement = function (containerEl) {
    var video = containerEl.createElement('video');
    video.width = WebRtcVideo.VIDEO_WIDTH;
    video.height = WebRtcVideo.VIDEO_HEIGHT;
    video.autoplay = true;
    return video;
}

WebRtcVideo.prototype.queryVideoSources = function (success_callback, video_sources) {
    var source_reader_callback = function (sourceInfos) {
        video_sources = [];
        for (var i=0; i<sourceInfos.length; ++i) {
            var sourceInfo = sourceInfos[i];
            if (sourceInfo.kind === 'video') {
                video_sources.push(sourceInfo);
                console.log('Found video source - id: ' + sourceInfo.id);
            }
        }
        success_callback(video_sources);
    }

    if (typeof MediaStreamTrack === undefined) {
        console.error('MediaStreamTrack not available.');
    } else {
        MediaStreamTrack.getSources(source_reader_callback.bind(this));
    }
}

WebRtcVideo.prototype.initWebRtcVideo = function (callback, video_source) {
    navigator.getUserMedia = navigator.getUserMedia || 
                             navigator.webkitGetUserMedia || 
                             navigator.mozGetUserMedia || 
                             navigator.msGetUserMedia;
    var initSuccessCallback = function (stream) {
        if (this.videoEl_.mozSrcObject !== undefined) {
            this.videoEl_.mozSrcObject = stream;
        } else {
            this.videoEl_.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
        }
        this.videoEl_.play();

        callback(this.videoEl_);
    }

    function initErrorCallback(error) {
        console.error('An error occurred during WebRTC initialization.');
        if (error) {
            console.error(error);
        }
    }

    if (navigator.getUserMedia) {
        var constraints = { video: true };
        if (video_source != undefined) {
            console.log('Using video source:'+video_source.id)
            constraints.video.optional = [{sourceId: video_source.id}];
        } else {
            console.log('Using default video device');
        }
        navigator.getUserMedia(constraints, initSuccessCallback.bind(this), initErrorCallback.bind());
    } else {
        alert('Native web camera streaming (getUserMedia) not supported in this browser.');
    }
}