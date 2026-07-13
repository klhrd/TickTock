// src/script/clock.js

// default state
let state=
{
    is24hr:true,
    fontStyle:'sans', //'sans', 'serif', 'mono'
    isFullscreen:false
};

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
            const ampm=hours>=12?'PM':'AM';
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
        btn24hr.classList.add("active");
        btn12hr.classList.remove("active");
    });

    btn12hr?.addEventListener("click",()=>
    {
        state.is24hr=false;
        btn12hr.classList.add("active");
        btn24hr.classList.remove("active");
    });

    const fontBtns=
    {
        sans:document.getElementById("font-sans"),
        serif:document.getElementById("font-serif"),
        mono:document.getElementById("font-mono")
    };
    const clockContainer=document.querySelector(".clock-container");

    function updateFont(selectedStyle)
    {
        state.fontStyle=selectedStyle;

        // 移除所有字體按鈕的 active 狀態，並為當前選中的加上 active
        Object.keys(fontBtns).forEach(key=>
        {
            if (key===selectedStyle)
                fontBtns[key]?.classList.add("active");
            else
                fontBtns[key]?.classList.remove("active");
        });

        if(clockContainer)
        {
            switch (selectedStyle)
            {
                case 'sans':
                    clockContainer.style.fontFamily='ui-sans-serif, system-ui, sans-serif';
                    break;
                case 'serif':
                    clockContainer.style.fontFamily='ui-serif, Georgia, serif';
                    break;
                case 'mono':
                    clockContainer.style.fontFamily='ui-monospace, monospace';
                    break;
            }
        }
    }
    // 綁定三個字體按鈕的點擊事件
    fontBtns.sans?.addEventListener("click",()=>updateFont('sans'));
    fontBtns.serif?.addEventListener("click",()=>updateFont('serif'));
    fontBtns.mono?.addEventListener("click",()=>updateFont('mono'));

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
        if(clockScreen&&clockScreen.requestFullscreen)
        {
            clockScreen.requestFullscreen()
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

}

if(typeof window!=="undefined")
{
    window.addEventListener('DOMContentLoaded',initClock);
}