// src/scripts/digital-clock.js

// default state
let state=
{
    is24hr:true,
    fontStyle:'sans', //'sans', 'serif', 'mono'
    isFullscreen:false
};

function loadSavedState()
{
    if (typeof window==="undefined")return;

    const hash=window.location.hash.replace('#','');
    let saved24hr=localStorage.getItem('clock_is24hr');
    let savedFont=localStorage.getItem('clock_fontStyle');
    
    if(hash)
    {
        const params=hash.split('&');
        params.forEach(param=>
        {
            if(param==='12hr')saved24hr='false';
            if(param==='24hr')saved24hr='true';
            if(['sans','serif','mono'].includes(param))savedFont=param;
        });
    }

    if(saved24hr!==null)state.is24hr=(saved24hr==='true');
    if(savedFont!==null)state.fontStyle=savedFont;

}

function syncStateToURLAndStorage()
{
    if(typeof window==="undefined")return;

    const hrParam=state.is24hr?'24hr':'12hr';

    localStorage.setItem('clock_is24hr',state.is24hr);
    localStorage.setItem('clock_fontStyle',state.fontStyle);

    window.location.hash=`${hrParam}&${state.fontStyle}`;
}

function applyStateToUI()
{
    const btn24hr=document.getElementById("btn-24hr");
    const btn12hr=document.getElementById("btn-12hr");

    if(state.is24hr)
    {
        btn24hr.classList.add("active");
        btn12hr.classList.remove("active");
    }
    else
    {
        btn12hr.classList.add("active");
        btn24hr.classList.remove("active");
    }

    const fontBtns=
    {
        sans:document.getElementById("font-sans"),
        serif:document.getElementById("font-serif"),
        mono:document.getElementById("font-mono")
    };

    Object.keys(fontBtns).forEach(key=>
    {
        if (key===state.fontStyle)
            fontBtns[key]?.classList.add("active");
        else
            fontBtns[key]?.classList.remove("active");
    });

    let fontValue='ui-sans-serif, system-ui, sans-serif';
    let colonWidth='clamp(1rem, calc(7vw - 1.2rem), 8rem)'; // 預設 Sans 寬度

    switch (state.fontStyle)
    {
        case 'sans':
            fontValue='ui-sans-serif, system-ui, sans-serif';
            colonWidth='clamp(1rem, calc(7vw - 1.2rem), 8rem)'
            break;
        case 'serif':
            fontValue='ui-serif, Georgia, serif';
            colonWidth='clamp(0.5rem, calc(8vw - 16rem), 8rem)';
            break;
        case 'mono':
            fontValue='ui-monospace, monospace';
            colonWidth='clamp(1rem, calc(7vw - 1.2rem), 8rem)'
            break;
    }

    document.documentElement.style.setProperty('--clock-font',fontValue);
    document.documentElement.style.setProperty('--clock-colon-width',colonWidth);
    

}


// DOM
let txtHours, txtMinutes, txtSeconds, txtAmPm, colons, dateLabel;

function initClock()
{
    if(typeof window==="undefined"||typeof document==="undefined")return;

    txtHours=document.getElementById("txt-hours");
    txtMinutes=document.getElementById("txt-minutes");
    txtSeconds=document.getElementById("txt-seconds");
    txtAmPm=document.getElementById("txt-ampm");
    colons=document.querySelectorAll(".colon");
    dateLabel=document.getElementById("date-label");

    loadSavedState();
    applyStateToUI();
    syncStateToURLAndStorage();

    startClockLoop();
    startColonAnimation();
    initListeners();
}

function startClockLoop()
{
    function updateTime()
    {
        const now=new Date();

        if(dateLabel)
        {
            dateLabel.innerText=now.toLocaleDateString('en-US',
            {
                weekday:'long',
                year:'numeric',
                month:'long',
                day:'numeric'
            });
        }
        let hours=now.getHours();
        const minutes=String(now.getMinutes()).padStart(2,'0');
        const seconds=String(now.getSeconds()).padStart(2,'0');

        if(!state.is24hr)
        {
            const ampm=hours>=12?'Post Meridiem':'Ante Meridiem';
            txtAmPm.innerText=ampm;
            hours=hours%12;
            hours=hours?hours:12;
            txtHours.innerText=String(hours).padStart(2,'0');
        }
        else
        {
            txtAmPm.innerText='';
            txtHours.innerText=String(hours).padStart(2,'0');
        }

        txtMinutes.innerText=minutes;
        txtSeconds.innerText=seconds;

        setTimeout(updateTime,100);
    }
    updateTime();
}

function startColonAnimation()
{
    // timestamp 是瀏覽器傳入的高精度毫秒數
    function animate(timestamp)
    {
        // 呼吸一輪的週期（毫秒）
        const period=1000;
        const radians=(timestamp/period)*Math.PI;

        // Math.sin() 的輸出範圍是 -1 到 1
        // 把它對齊轉換成透明度範圍 0.2 到 1.0 之間
        const opacity=0.6+Math.sin(radians)*0.4;

        colons.forEach(colon => 
        {
            if(colon)colon.style.opacity=opacity;
        });
        // 使用瀏覽器幀率，確保動畫極致流暢
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function initListeners()
{
    const btn24hr=document.getElementById("btn-24hr");
    const btn12hr=document.getElementById("btn-12hr");

    btn24hr?.addEventListener("click",()=>
    {
        state.is24hr=true;
        applyStateToUI();
        syncStateToURLAndStorage();
    });

    btn12hr?.addEventListener("click",()=>
    {
        state.is24hr=false;
        applyStateToUI();
        syncStateToURLAndStorage();
    });

    const fontBtns=
    {
        sans:document.getElementById("font-sans"),
        serif:document.getElementById("font-serif"),
        mono:document.getElementById("font-mono")
    };

    // 綁定三個字體按鈕的點擊事件
    fontBtns.sans?.addEventListener("click",()=>
    {
        state.fontStyle='sans';
        applyStateToUI();
        syncStateToURLAndStorage();
    });
    fontBtns.serif?.addEventListener("click",()=>
    {
        state.fontStyle='serif';
        applyStateToUI();
        syncStateToURLAndStorage();
    });
    fontBtns.mono?.addEventListener("click",()=>
    {
        state.fontStyle='mono';
        applyStateToUI();
        syncStateToURLAndStorage();
    });
    
    const btnFullscreen=document.getElementById("btn-fullscreen");
    const btnFullscreenExit=document.getElementById("btn-fullscreen-exit");
    const clockScreen=document.getElementById("clock-screen");

    function updateFullscreenBtns(isFullscreenMode)
    {
        state.isFullscreen=isFullscreenMode;
        if(isFullscreenMode)
        {
            btnFullscreenExit?.classList.add("active");
            btnFullscreen?.classList.remove("active");
        }
        else
        {
            btnFullscreen?.classList.add("active");
            btnFullscreenExit?.classList.remove("active");
        }
    }

    btnFullscreen?.addEventListener("click",()=>
    {
        const rootElement=document.documentElement;
        if(rootElement&&rootElement.requestFullscreen)
        {
            rootElement.requestFullscreen()
                .then(()=>updateFullscreenBtns(true))
                .catch(err=>console.log("Fail to Fullscreen: ",err));
        }
    });

    btnFullscreenExit?.addEventListener("click",()=>
    {
        if(document.fullscreenElement&&document.exitFullscreen)
        {
            document.exitFullscreen()
                .then(()=>updateFullscreenBtns(false))
                .catch(err=>console.log("Fail to Exit Fullscreen: ",err));
        }
    });

    document.addEventListener("fullscreenchange",()=>
    {
        const isCurrentlyFullscreen=!!document.fullscreenElement;
        updateFullscreenBtns(isCurrentlyFullscreen);
    });

    const shareMenuBtn=document.getElementById("share-menu-btn");

    shareMenuBtn?.addEventListener("click",async()=>
    {
        const shareData=
        {
            title: `TickTock | Clock`,
            text: `Check out this digital clock!`,
            url: window.location.href // 包含當前日期與名稱的 hash 網址
        };

        try
        {
            if(navigator.share)
            {
                await navigator.share(shareData);
            }
            else
            {
                await navigator.clipboard.writeText(window.location.href);

                const icon=shareMenuBtn.querySelector(".material-symbols-outlined");
                
                if(icon)
                {
                    icon.innerText="check";
                    shareMenuBtn.style.color="#fffa65"

                    setTimeout(()=>
                    {
                        icon.innerText="share";
                        shareMenuBtn.style.color="";
                    },2000);
                }
            }
        }
        catch(err)
        {
            console.log("Fail to Share: ", err);
        }
    });

}

if(typeof window!=="undefined")
{
    window.addEventListener('DOMContentLoaded',initClock);
}