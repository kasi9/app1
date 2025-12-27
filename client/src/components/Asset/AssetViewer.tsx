import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Asset } from "../../types/asset.type";
import type { YouTubePlayer } from "react-youtube";
import YouTube from "react-youtube";
import { toast } from "react-toastify";

export interface AssetViewerRef { 
    viewOrPlay: () => void;
    pause?: () => void;
    resume?: () => void;
    movePrevious: () => void;
    moveNext: () => void;
    stop: () => void;
    getCurrentTime: () => number;
    seekTo: (start: number) => void;
    pauseVideo: () => void;
}

interface AssetViewerProps { 
    src: Asset[]; 
    onPrePlay?: () => void;
}

const AssetViewer = forwardRef<AssetViewerRef, AssetViewerProps>(({ src, onPrePlay }, ref) => {

    const divRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const documentRef = useRef<HTMLIFrameElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const youTubeVideoRef = useRef<YouTubePlayer>(null);
    const timerRef = useRef<number | null>(null);
    const fullScreenRef = useRef<HTMLButtonElement>(null);
    const downloadRef = useRef<HTMLButtonElement>(null);
    const playAllRef = useRef<HTMLButtonElement>(null);
    const previousRef = useRef<HTMLButtonElement>(null);
    const stopRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    const [currentIndex, setCurrentIndex] = useState<number|null>(null);
    const [, setIsFullscreen] = useState(false);
    const [isAutoPlay, setIsAutoPlay] = useState(false);

    useImperativeHandle(ref, () => ({
        viewOrPlay: () => playAudio(),
        movePrevious: () => setCurrentIndex(prev => (prev === null ? null : prev-1)),
        moveNext: () => setCurrentIndex(prev => (prev === null ? null : prev+1)),
        stop: () => clearTimer(),
        getCurrentTime: () => { 
            if (src[currentIndex!].assetType == "youTube")
                return youTubeVideoRef.current.getCurrentTime() | 0 ;
            else if (src[currentIndex!].assetType === "video")
                return videoRef.current?.currentTime ?? 0;
            else if (src[currentIndex!].assetType === "audio")
                return audioRef.current?.currentTime ?? 0;

            return 0;
        },
        seekTo: (sec: number) => { 
            if (src[currentIndex!].assetType == "youTube"){
                youTubeVideoRef.current.seekTo(sec, true) ;
            }
            else if (src[currentIndex!].assetType === "video"){
                console.log('adsfldkj');
                videoRef.current!.currentTime = sec;
            }
            else if (src[currentIndex!].assetType === "audio"){
                audioRef.current!.currentTime = sec;
            }
        },
        pauseVideo: () => youTubeVideoRef.current?.pauseVideo(),
    }));

    const playAuto = () => {
        onPrePlay?.();
        setCurrentIndex(0);
        setIsAutoPlay(true);
        viewOrPlayAsset(0)
        toast.success('Started playing...');
    }

    const stopAutoPlay = () => {
        clearTimer();
        setIsAutoPlay(false);
    }

    useEffect(() => {

        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft") {
                setCurrentIndex(prev => (previousRef.current?.className === "btn") ? (prev??0) - 1 : 0);
            } else if (event.key === "ArrowRight") {
                setCurrentIndex(prev => (nextRef.current?.className === "btn") ? (prev??0) + 1 : prev);
            }
        };

        const handleFullScreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        window.addEventListener("keydown", handleKeyPress);
        document.addEventListener("fullscreenchange", handleFullScreenChange);

        return () => {
            clearTimer(); 
            window.removeEventListener("keydown", handleKeyPress); 
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
        }

    }, []);

    useEffect(()=>{
        setCurrentIndex(()=>src.length-1);
    },[src]); 

    useEffect(() => {   

        if (currentIndex !== null) {
            if (isAutoPlay && (src[currentIndex]?.assetType === "pdf" || src[currentIndex]?.assetType === "webLink"))
                toast.warn('Press next button to move next slide.');
            viewOrPlayAsset(currentIndex);
        }

    }, [currentIndex]);

    useEffect(() => {
        if (isAutoPlay && currentIndex === src.length - 1) {
            toast.success("Playing ended.");
        }
    }, [isAutoPlay, currentIndex, src.length]);

    useEffect(() => {
        setButtons();
    }, [src, currentIndex]);

    const setButtons = () => {

        if (fullScreenRef.current && src && src.length > 0) {
            fullScreenRef.current.className = "btn"        
            fullScreenRef.current.disabled = false;
        } else {
            if (fullScreenRef.current) {
                fullScreenRef.current.className = "btnDisabled"        
                fullScreenRef.current.disabled = true;
            }
        }

        if (downloadRef.current && src && src.length === 1 ) {
            downloadRef.current.className = "btn";
            downloadRef.current.disabled = false;
        } else {
            if (downloadRef.current) {
                downloadRef.current.className = "btnDisabled";
                downloadRef.current.disabled = true;
            }
        }

        if (playAllRef.current && src && src.length > 1 ) {
            playAllRef.current.className = "btn";
            playAllRef.current.disabled = false;
        } else {
            if (playAllRef.current) {
                playAllRef.current.className = "btnDisabled";
                playAllRef.current.disabled = true;
            }
        }

        if (previousRef.current && currentIndex && currentIndex > 0) {
            previousRef.current.className = "btn";
            previousRef.current.disabled = false;
        } else {
            if (previousRef.current) {
                previousRef.current.className = "btnDisabled";
                previousRef.current.disabled = true;
            }
        }

        if (stopRef.current && currentIndex && src && currentIndex < (src.length-1)) {
//console.log('stop enabled: ', currentIndex, src);            
            stopRef.current.className = "btn";
            stopRef.current.disabled = false;
        } else {
//console.log('stop else: ', currentIndex, src);            
            if (stopRef.current) {
//console.log('stop disabled: ', currentIndex, src);            
                stopRef.current.className = "btnDisabled";
                stopRef.current.disabled = true;
            }
        }

        if (nextRef.current && currentIndex && src && currentIndex < (src.length-1)) {
            nextRef.current.className = "btn";
            nextRef.current.disabled = false;
        } else {
            if (nextRef.current) {
                nextRef.current.className = "btnDisabled";
                nextRef.current.disabled = true;
            }
        }

    }

    const viewOrPlayAsset = (idx: number) => {

        clearTimer();

        if (!src[idx]) {
            return;
        }

        if (src[idx].assetType === "audio") 
            playAudio();
        else if (src[idx].assetType === "image" || src[idx].assetType === "gmap") 
            startSlideshow();            
        else if (src[idx].assetType === "video") 
            setTimeout(() => playVideo(), 1000);      
        else if (src[idx].assetType === "youTube") {  
            setTimeout(() => playYouTubeVideo(), 2000);        
        }
    }

    const startSlideshow = () => {
        clearTimer();

        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => {
                const next =  (prev === null ? null : prev + 1);

                if (next !== null && next >= src.length) {
                    clearTimer();
                    setIsAutoPlay(()=>false);

                    return prev;
                }

                return next;
            });
        }, 3000);
    };

    const playAudio = () => {
        clearTimer();

        const audio = audioRef.current;
        if (!audio) return;

        if (src[currentIndex!].segments ?? [].length>0)
            playAudioSegments();

        audio.pause();
        audio.currentTime = 0;

        if (isAutoPlay)
            audio.oncanplay = () => audio.play().catch(err => console.warn("Autoplay blocked:", err));
        else
            audio.pause();
    };
  
    const playAudioSegments = async () => {
        if (currentIndex === null) return;

        let player = await audioRef.current;
        if (!player) {
            console.warn("⚠ YouTube Player not ready. Retrying...");
            player = audioRef.current;
        }        

        const segments = src[currentIndex]?.segments ?? [];
        if (segments.length === 0) 
            return;

        for (const seg of segments) {
            player!.currentTime = seg.start;
            player!.play();

            await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                const current = player!.currentTime;
                if (current >= seg.end!) {
                player!.pause();
                clearInterval(interval);
                resolve();
                }
            }, 1000); 
            });
        }

        setCurrentIndex(prev => {
            const next =  (prev === null ? null : prev + 1);

            if (next !== null && next >= src.length) {
                clearTimer();
                setIsAutoPlay(()=>false);

                return prev;
            }

            return next;
        });

        console.log("✅ Finished playing all segments");
    };

    const playVideo = () => {
        if (timerRef.current) clearTimer();

        const video = videoRef.current;
        if (!video) return;

        if (src[currentIndex!].segments ?? [].length>0)
            playVideoSegments();

        video.currentTime = 0;
        if (isAutoPlay)
            video.oncanplay = () => video.play().catch(err => console.log("Autoplay blocked:", err));
        else 
            video.pause();

    };

    const playVideoSegments = async () => {
        if (currentIndex === null) return;

        let player = await videoRef.current;
        if (!player) {
            console.warn("⚠ YouTube Player not ready. Retrying...");
            player = videoRef.current;
        }        

        const segments = src[currentIndex]?.segments ?? [];
        if (segments.length === 0) 
            return;

        for (const seg of segments) {
            player!.currentTime = seg.start;
            player!.play();

            await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                const current = player!.currentTime;
                if (current >= seg.end!) {
                player!.pause();
                clearInterval(interval);
                resolve();
                }
            }, 1000); 
            });
        }

        setCurrentIndex(prev => {
            const next =  (prev === null ? null : prev + 1);

            if (next !== null && next >= src.length) {
                clearTimer();
                setIsAutoPlay(()=>false);

                return prev;
            }

            return next;
        });

        console.log("✅ Finished playing all segments");
    };

    const handleAudioOrVideoEnded = () => {
        const next = (currentIndex !== null ? currentIndex + 1 : null);

        if (next !== null && next < src.length) {
            setCurrentIndex(next);
            viewOrPlayAsset(next);
        }
    };

    const onYouTubeReady = (event: { target: YouTubePlayer }) => {
        youTubeVideoRef.current = event.target;
    };

    const playYouTubeVideo = () => {
        if (!src || currentIndex === null)
            return ;

        if (timerRef.current) clearTimer();

        const video = youTubeVideoRef.current;
        if (!video) return;

        if (src[currentIndex].segments ?? [].length>0)
            playYouTubeSegments();
        
        video.seekTo(0);
        video.playVideo();
    };

    const playYouTubeSegments = async () => {
        if (currentIndex === null) return;

        let player = await youTubeVideoRef.current;
        if (!player) {
            console.warn("⚠ YouTube Player not ready. Retrying...");
            player = youTubeVideoRef.current;
        }        

        const segments = src[currentIndex]?.segments ?? [];
        if (segments.length === 0) 
            return;

        for (const seg of segments) {
            player.seekTo(seg.start);
            player.playVideo();

            await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                const current = player.getCurrentTime();
                if (current >= seg.end!) {
                player.pauseVideo();
                clearInterval(interval);
                resolve();
                }
            }, 1000); 
            });
        }
        
        setCurrentIndex(prev => {
            const next =  (prev === null ? null : prev + 1);

            if (next !== null && next >= src.length) {
                clearTimer();
                setIsAutoPlay(()=>false);

                return prev;
            }

            return next;
        });


        console.log("✅ Finished playing all segments");
    };

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    const openFullscreen = () => {
        divRef.current?.requestFullscreen?.();
    };

    const downloadFile = (fileName: string) => {
        window.open(`${fileName}`,"_blank");
    };

/*    const downloadFile = (fileName: string) => {
        window.open(
            `${baseURL}/downloads/${fileName}`,
            "_blank"
        );
    };*/

    return (

<div ref={divRef} className="border-2 border-purple-500 m-2 h-full flex flex-col md:flex-row" >
  {/* LEFT SECTION – CONTROLS */}
  <div className="md:w-1/5 w-full border-r p-2 space-y-2">

    <button onClick={openFullscreen} ref = { fullScreenRef } >Full Screen</button>
    <button onClick={() => downloadFile(src[0].filePath ?? "")} ref = { downloadRef } >Download</button>
    <button onClick={playAuto} ref = { playAllRef } >Play All</button>
    <button onClick={() => setCurrentIndex(prev => (prev === null ? null : prev - 1))} ref = { previousRef} >Previous</button>
    <button onClick={stopAutoPlay} ref = { stopRef } >Stop</button>
    <button onClick={() => setCurrentIndex(prev => (prev === null ? 0 : prev + 1))} ref = { nextRef } >Next</button>
  </div>

  {/* RIGHT SECTION – VIEWER */}
  <div className="md:w-4/5 w-full h-full flex items-center justify-center">

        {(currentIndex !== null &&  src[currentIndex]?.assetType === "video") && (
            <div style={{ width: "100%", height: "90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <video key={src[currentIndex].filePath} ref={videoRef} controls onEnded={ handleAudioOrVideoEnded }>
                    <source src= {src[currentIndex]?.filePath} type="video/mp4" />
                </video>
            </div>
        )}

        {(currentIndex !== null &&  src[currentIndex]?.assetType === "youTube") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center"}}>
                <YouTube videoId={`${src[currentIndex]?.filePath}`} onReady={onYouTubeReady} onEnd={ handleAudioOrVideoEnded }
                    opts={{ width: "100%", height: "100%", playerVars: { autoplay: 0, }, }} className="youtube-container"/>
            </div>
        )}

        {(currentIndex !== null &&  src[currentIndex]?.assetType === "audio") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <audio key={src[currentIndex]?.filePath} ref={audioRef} controls src= {src[currentIndex]?.filePath} onEnded={ handleAudioOrVideoEnded } />
            </div>
        )}

        {(currentIndex !== null &&  src[currentIndex]?.assetType === "image") && ( // final don't change alignment
            <div className="w-full h-full flex items-center justify-center">
            <img key={src[currentIndex].filePath} ref={imgRef} src= {src[currentIndex]?.filePath} className="max-w-full max-h-full object-contain"/>
            </div>
        )}

        {(currentIndex !== null &&  src[currentIndex]?.assetType === "pdf") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <iframe style={{ width:"100%", height:"100%"}} src= {src[currentIndex]?.filePath} ref = {documentRef} title="PDF Viewer" 
                />
            </div>
        )}

        {(currentIndex !== null &&  src[currentIndex]?.assetType === "gmap") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <iframe src={`https://www.google.com/maps?q=${src[currentIndex]?.lat},${src[currentIndex]?.lng}&z=14&output=embed`}
                    loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"     
                    style={{ width: "100%", height: "100%", border: 0, }}>
                </iframe>
            </div>
        )}

        {(currentIndex !== null &&  src[currentIndex]?.assetType === "webLink") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <iframe src={`${src[currentIndex]?.filePath}`} style={{ width: "100%", height: "100%", border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade">
                </iframe>
            </div>
        )}
  </div>
</div>

    );
});

export default AssetViewer;
