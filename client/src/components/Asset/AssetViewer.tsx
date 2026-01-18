import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Asset } from "../../types/Asset.type";
import type { YouTubePlayer } from "react-youtube";
import YouTube from "react-youtube";
import { toast } from "react-toastify";
import { renderAsync } from "docx-preview";

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

interface AssetViewerProps { assets: Asset[]; onPrePlay?: () => void; }

type SegmentPlayer = { play: () => void; pause: () => void; getTime: () => number; setTime: (t: number) => void; };

const AssetViewer = forwardRef<AssetViewerRef, AssetViewerProps>(({ assets, onPrePlay }, ref) => {

    const divRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const youTubeVideoRef = useRef<YouTubePlayer>(null);
    const docRef = useRef<HTMLDivElement | null>(null);
    const intervalRef = useRef<number | null>(null);

    const [ currentIndex, setCurrentIndex ] = useState<number|null>(null);
    const [ isPlaying, setIsPlaying ] = useState(false);
    const [ , setIsFullscreen] = useState(false);
    const [ text, setText ] = useState("");

    useImperativeHandle(ref, () => ({
        viewOrPlay: playAudio,
        movePrevious: movePrevious2,
        moveNext: moveNext2,
        stop: clearTimer,
        getCurrentTime: getPlayingTimeNow,
        seekTo: getSeekToTimeNow,
        pauseVideo: () => youTubeVideoRef.current?.pauseVideo(),
    }));

    const movePrevious2 = () => {
        setCurrentIndex(prev => {
            if (prev === null) return 0;
            return Math.max(prev - 1, 0);
        });
    }

    const moveNext2 = () => {
        setCurrentIndex(prev => {
            if (prev === null) return 0;
            return Math.min(prev + 1, assets.length - 1);
        });
    }

    const privileges = useMemo(() => ({
        canFullScreen: assets.length > 0,
        canDownload: assets.length === 1,
        canPlayAll: assets.length > 1,
        canPrev: currentIndex != null && currentIndex > 0,
        canNext: currentIndex != null && currentIndex < assets.length - 1,
        canStop: isPlaying,
    }), [assets.length, currentIndex, isPlaying]);

    const currentAsset = useMemo(() => {
        if (currentIndex == null) return null;
        return assets[currentIndex] ?? null;
    }, [assets, currentIndex]);

    const getPlayingTimeNow = () => {
        if (currentAsset?.assetType == "youTube")
            return youTubeVideoRef.current.getCurrentTime() | 0 ;
        else if (currentAsset?.assetType === "video")
            return videoRef.current?.currentTime ?? 0;
        else if (currentAsset?.assetType === "audio")
            return audioRef.current?.currentTime ?? 0;

        return 0;        
    }

    const getSeekToTimeNow = (sec: number) => {
        if (currentAsset?.assetType == "youTube"){
            youTubeVideoRef.current.seekTo(sec, true) ;
        }
        else if (currentAsset?.assetType === "video"){
            videoRef.current!.currentTime = sec;
        }
        else if (currentAsset?.assetType === "audio"){
            audioRef.current!.currentTime = sec;
        }        
    }

    const playAuto = () => {
        onPrePlay?.();
        setCurrentIndex(0);
        setIsPlaying(true);
        viewOrPlayAsset(0)
        toast.success('Started playing...');
    }

    const stopAutoPlay = () => {
        clearTimer();
        setIsPlaying(false);
    }

    useEffect(() => {

        const handleKeyPress = (event: KeyboardEvent) => {
            clearTimer();
            if (event.key === "ArrowLeft") {
                setCurrentIndex(prev => {
                if (prev === null) return 0;
                return Math.max(prev - 1, 0);
                });
            }

            if (event.key === "ArrowRight") {
                setCurrentIndex(prev => {
                if (prev === null) return 0;
                return Math.min(prev + 1, assets.length - 1);
                });
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

    }, [assets.length]);

    useEffect(()=>{
        setCurrentIndex(assets.length > 0 ? assets.length - 1 : null);
    },[assets]); 

    useEffect(() => {   

        if (currentIndex !== null) {
            if (isPlaying && (currentAsset?.assetType === "pdf" || currentAsset?.assetType === "webLink"))
                toast.warn('Press next button to move next slide.');
            
            viewOrPlayAsset(currentIndex);
        }

    }, [currentIndex]);

    useEffect(() => {
        if (isPlaying && currentIndex === assets.length - 1) {
            toast.success("Playing ended.");
        }
    }, [isPlaying, currentIndex, assets.length]);

    useEffect(() => {
        if (currentAsset?.isPreview && currentAsset?.assetType==="doc")
            setDocPreview();
        else if (currentAsset && currentAsset?.assetType==="text"/* && currentAsset?.file*/) 
            setTextPreview(currentAsset ?? null);

    }, [assets, currentIndex]);

    const viewOrPlayAsset = (idx: number) => {

        clearTimer();

        const asset = assets[idx];
        if (!asset) return;

        switch (asset.assetType) {
            case "audio": return playAudio();
            case "image":
            case "gmap": return startSlideshow();
            case "video": return setTimeout(playVideo, 1000);
            case "youTube": return setTimeout(playYouTubeVideo, 2000);
        }        
    }

    const startSlideshow = () => {
        clearTimer();

        intervalRef.current = setInterval(() => {
            
            setCurrentIndex(prev => {
                const next =  (prev === null ? null : prev + 1);

                if (next !== null && next >= assets.length) {
                    clearTimer();
                    setIsPlaying(()=>false);

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

        if ((currentAsset?.segments ?? []).length>0)
            playSegments({ play: () => audio.play(), pause: () => audio.pause(), getTime: () => audio.currentTime, setTime: t => (audio.currentTime = t), });

        audio.currentTime = 0;
        if (isPlaying)
            audio.oncanplay = () => audio.play().catch(err => console.warn("Autoplay blocked:", err));
        else
            audio.pause();
    };

    const playVideo = () => {
        if (intervalRef.current) clearTimer();

        const video = videoRef.current;
        if (!video) return;

        if ((currentAsset?.segments ?? []).length>0)
            playSegments({ play: () => video.play(), pause: () => video.pause(), getTime: () => video.currentTime, setTime: t => (video.currentTime = t), });

        video.currentTime = 0;
        if (isPlaying)
            video.oncanplay = () => video.play().catch(err => console.log("Autoplay blocked:", err));
        else 
            video.pause();

    };

    const handleAudioOrVideoEnded = () => {
        const next = (currentIndex !== null ? currentIndex + 1 : null);

        if (next !== null && next < assets.length) {
            setCurrentIndex(next);
            viewOrPlayAsset(next);
        }
    };

    const onYouTubeReady = (event: { target: YouTubePlayer }) => {
        youTubeVideoRef.current = event.target;
    };

    const playYouTubeVideo = () => {
        if (!assets || currentIndex === null)
            return ;

        if (intervalRef.current) clearTimer();

        const video = youTubeVideoRef.current;
        if (!video) return;

        if ((currentAsset?.segments ?? []).length>0)
            playSegments({ play: () => video.playVideo(), pause: () => video.pauseVideo(), getTime: () => video.getCurrentTime(), setTime: t => video.seekTo(t, true) });
        
        video.seekTo(0);
        video.playVideo();
    };

    const setDocPreview = async () => {
        const file = currentAsset?.file;
        const arrayBuffer = await file?.arrayBuffer();
        await renderAsync(arrayBuffer, docRef.current!);            
    }

    const setTextPreview = async (asset: Asset | null) => {
        if (!asset?.file) {
            await fetch(`${asset?.filePath}`).then(res => res.text()).then(setText).catch(console.error);
            return ;
        }

        const reader = new FileReader();
        reader.onload = () => setText(reader.result as string);       
        reader.readAsText(asset.file);                
    }

    const goNextAfterSegments = () => {
        setCurrentIndex(prev => {
            if (prev === null) return prev;

            const next = prev + 1;

            if (next >= assets.length) {
                clearTimer();
                setIsPlaying(false);
                return prev; // stay on last
            }

            return next;
        });
    };

    const playSegments = async (player: SegmentPlayer) => {
        if (currentIndex === null) return;

        const segments = currentAsset?.segments ?? [];
        if (!segments.length) return;

        for (const seg of segments) {
            player.setTime(seg.start);
            player.play();

            await new Promise<void>(resolve => {
            const i = setInterval(() => {
                if (player.getTime() >= seg.end!) {
                player.pause();
                clearInterval(i);
                resolve();
                }
            }, 300);
            });
        }

        goNextAfterSegments();
    };

    const clearTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
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

    <button onClick={ openFullscreen } className="btn" disabled = { !privileges.canFullScreen } >Full Screen</button>
    <button onClick={ ()=> downloadFile(assets[0].filePath ?? "")} className="btn" disabled = { !privileges.canDownload } >Download</button>
    <button onClick={ ()=> playAuto() } className="btn" disabled = { !privileges.canPlayAll } >Play All</button>
    <button onClick={ ()=> movePrevious2() } className="btn" 
        disabled = { !privileges?.canPrev } >Previous</button>
    <button onClick={ ()=> stopAutoPlay() } className="btn" disabled = { !privileges?.canStop } >Stop</button>
    <button onClick={ ()=> moveNext2() } className="btn" disabled = { !privileges?.canNext }>Next</button>
  </div>

  {/* RIGHT SECTION – VIEWER */}
  <div className="md:w-4/5 w-full h-full flex items-center justify-center">

        {(currentIndex !== null &&  currentAsset?.assetType === "video") && (
            <div style={{ width: "100%", height: "90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <video key="video" ref={videoRef} controls onEnded={ handleAudioOrVideoEnded }>
                    <source src= {currentAsset?.filePath} type="video/mp4" />
                </video>
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "youTube") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center"}}>
                <YouTube videoId={`${currentAsset?.filePath}`} onReady={onYouTubeReady} onEnd={ handleAudioOrVideoEnded }
                    opts={{ width: "100%", height: "100%", playerVars: { autoplay: 0, }, }} className="youtube-container"/>
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "audio") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <audio key="audio" ref={audioRef} controls src= {currentAsset?.filePath} onEnded={ handleAudioOrVideoEnded } />
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "image") && ( // final don't change alignment
            <div className="w-full h-full flex items-center justify-center">
            <img key="image" ref={imgRef} src= {currentAsset?.filePath} className="max-w-full max-h-full object-contain"/>
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "pdf") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <iframe style={{ width:"100%", height:"100%"}} src= {currentAsset?.filePath} title="PDF Viewer" 
                />
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "gmap") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <iframe src={`https://www.google.com/maps?q=${currentAsset?.lat},${currentAsset?.lng}&z=14&output=embed`}
                    loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"     
                    style={{ width: "100%", height: "100%", border: 0, }}>
                </iframe>
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "webLink") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <iframe src={`${currentAsset?.filePath}`} style={{ width: "100%", height: "100%", border: 0 }} 
                    loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade">
                </iframe>
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "text") && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <pre>{ text }</pre>
            </div>
        )}

        {(currentIndex !== null &&  currentAsset?.assetType === "doc" && !currentAsset.file) && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
                <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(currentAsset.filePath)}&embedded=true`} 
                    width="100%" height="600" 
                />
            </div>
        )}
        {(currentIndex !== null &&  currentAsset?.assetType === "doc" && currentAsset?.file) && (
            <div style={{ width:"100%", height:"90%", display:"flex", justifyContent:"center", alignItems:"center", }}>
            <div ref={docRef} />
            </div>
        )}

  </div>
</div>

    );
});

export default AssetViewer;
