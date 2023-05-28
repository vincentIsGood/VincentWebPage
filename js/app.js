import {GeneralUtils, PositionUtils, ScrollUtils, ScrollUtilsOption, AnimationUtils, ScrollTemplates, resolveCssValue} from "./utils.js";
import './scroll-timeline.js';

const MOBILE_MODE = window.innerWidth < 1000;

let scrollUtils = new ScrollUtils();

window.onload = ()=>{
    // TODO: create loading screen (then clear it out at the bottom of this function)
    window.scrollUtils = scrollUtils; // for debug

    AnimationUtils.initCharacters(document.querySelector(".top-bar .name-item"));
    AnimationUtils.animateCharacters(document.querySelector(".top-bar .name-item"));
    GeneralUtils.iterate(document.querySelectorAll(".menu-button"), (ele)=>{
        GeneralUtils.registerCssClassToggleClick(ele, document.querySelector(".collapsable-menu"), "hidden");
    });

    scrollUtils.registerListener({
        callback: (a,b,c,finish,notFinish)=>{
            document.querySelector(".top-bar").classList.add("change-color");
            notFinish();
        },
        outsideCallback(){
            document.querySelector(".top-bar").classList.remove("change-color");
        },
        option: new ScrollUtilsOption({
            startY: PositionUtils.absPos(document.querySelector(".skills")).y,
        }),
    });

    setupIntro();
    setupSkills();
    setupProjects();
    setupTransition();

    scrollUtils.registerDocumentScroll();
    // clear out loading screen here
}

function setupIntro(){
    GeneralUtils.iterate(document.getElementsByClassName('parallax-bg-shape'), (element)=>{
        element.animate(
            { transform: ['translateY(0)', 'translateY(20rem)']},
            {
                fill: 'both',
                timeline: new ScrollTimeline({
                    scrollOffsets: [
                        new CSSUnitValue(0, 'rem'),
                        new CSSUnitValue(20, 'rem')
                    ]
                }),
            }
        );
    });

    GeneralUtils.iterate(document.querySelectorAll(".intro .title"), AnimationUtils.initCharacters);
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".intro .left .title"), 500, "-20rem");
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".intro .right .title"), 0, "-20rem");

    GeneralUtils.iterate(document.querySelectorAll(".intro .photo-card"), (element, i, len)=>{
        let offset = PositionUtils.offsetToCenter(element, document.querySelector(".intro .collector-view"));
        element.style.left = `${offset.x}px`;
        element.style.top = `${offset.y}px`;
        element.style.setProperty("--rotate", (-30 + i*60/len) + "deg"); // range = 60deg (-30 to 30)

        element.addEventListener("click", ()=>{
            if(element.classList.contains("animating")){
                element.style.left = 0;
                element.style.top = 0;
            }else{
                element.style.left = `${offset.x}px`;
                element.style.top = `${offset.y}px`;
            }
            element.classList.toggle("animating");
        });
    });

    GeneralUtils.iterate(document.querySelectorAll(".intro .collapsable"), (element)=>{
        GeneralUtils.registerCssClassToggleClick(element, element.querySelector(".desc"), "hidden");
        scrollUtils.registerListener({
            callback: (a,b,c,finish,notFinish)=>{
                element.querySelector(".desc").classList.remove("hidden");
                notFinish();
            },
            outsideCallback: ()=>{
                element.querySelector(".desc").classList.add("hidden");
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(element).y - resolveCssValue("20rem"),
                endY: PositionUtils.absPos(element).y - resolveCssValue("10rem"),
            }),
        });

        element.animate(
            [
                { opacity: "0", transform: "translateX(-10rem)" }, 
                { opacity: "1", transform: "translateX(0)" }
            ], // same as { opacity: ["0", "1"] }
            {
                fill: "forwards",
                duration: 500,
            }
        );
    });
}

function setupSkills(){
    const skillsTimeline = document.querySelector(".skills .skills-timeline path");
    const timelinePathLength = skillsTimeline.getTotalLength();
    const timelineHeight = skillsTimeline.getBoundingClientRect().height;

    scrollUtils.registerListener({
        callback: (a,relativeYFromStart,relativeYFromEnd,finish, notFinish)=>{
            let offset = Math.max(0, Math.floor((timelineHeight + relativeYFromStart)/timelineHeight * timelinePathLength));
            skillsTimeline.style.strokeDashoffset = offset;
            notFinish();
        },
        outsideCallback: (scrollY, relativeYFromStart)=>{
            skillsTimeline.style.strokeDasharray = timelinePathLength;
            if(relativeYFromStart > 0)
                skillsTimeline.style.strokeDashoffset = timelinePathLength;
            else skillsTimeline.style.strokeDashoffset = 0;
        },
        option: new ScrollUtilsOption({
            startY: PositionUtils.absPos(skillsTimeline).y + resolveCssValue("-60vh"),
            endY: PositionUtils.absPos(skillsTimeline).y + timelineHeight,
        }),
    });

    const skillInfoPanels = document.querySelectorAll(".skills .skill-info");
    if(skillInfoPanels.length != document.querySelectorAll(".skills .skills-timeline circle").length){
        throw new Error("Illegal State: len(circle) != len(.skill-info)");
    }
    GeneralUtils.iterate(document.querySelectorAll(".skills .skills-timeline circle"), (element, i)=>{
        scrollUtils.registerListener({
            callback: (a,relativeYFromStart,c,finish, notFinish)=>{
                element.style.fill = "var(--color-bright)";
                element.style.r = 8;
                notFinish();
            },
            outsideCallback: ()=>{
                element.style.fill = "transparent";
                element.style.r = 4;
            },
            initCallback: ()=>{
                const absPos = PositionUtils.absPos(element);
                skillInfoPanels[i].style.left = absPos.x - 100;
                skillInfoPanels[i].style.top = absPos.y;
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(element).y + resolveCssValue("-60vh"),
                endY: PositionUtils.absPos(skillsTimeline).y + timelineHeight,
            }),
        });
    });

    GeneralUtils.iterate(skillInfoPanels, (element)=>{
        const elementWidth = element.getBoundingClientRect().width;
        const overScreen = PositionUtils.absPos(element).x - elementWidth <= 0;
        scrollUtils.registerListener({
            callback: (a,relativeYFromStart,c, finish, notFinish)=>{
                element.style.opacity = 1;
                element.style.transform = `translateX(${elementWidth}px)`;
                if(overScreen)
                    element.style.transform = `translateX(${elementWidth + resolveCssValue("20vw")}px)`;
                else element.style.transform = `translateX(-${elementWidth - resolveCssValue("5vw")}px)`;
                notFinish();
            },
            outsideCallback: ()=>{
                element.style.opacity = 0;
                element.style.transform = "translateX(5rem)";
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(element).y + resolveCssValue("-60vh"),
                endY: PositionUtils.absPos(skillsTimeline).y + timelineHeight,
                isInitSameAsOutside: true,
            }),
        });
    });
}

function setupProjects(){
    GeneralUtils.iterate(document.querySelectorAll(".projects .title"), AnimationUtils.initCharacters);
    ScrollTemplates.animateCharactersAt(scrollUtils, document.querySelector(".projects .top .title"), 0, "-70vh");

    GeneralUtils.iterate(document.querySelectorAll(".projects .collapsable"), (element, i)=>{
        if(MOBILE_MODE){
            GeneralUtils.registerCssClassToggleClick(element, element.querySelector(".desc"), "fade-smaller");
        }else GeneralUtils.registerCssClassToggleHover(element, element.querySelector(".desc"), "fade-smaller");
        scrollUtils.registerListener({
            outsideCallback: ()=>{
                element.style.transform = "translateX(-100vw)";
            },
            callback: (a,b,c,finish)=>{
                element.animate(
                    [
                        { opacity: "0", transform: "rotateZ(1deg)" }, 
                        { opacity: "0.5", transform: "rotateZ(-1deg)" },
                        { opacity: "1", transform: "rotateZ(0)" },
                    ],
                    {
                        fill: "forwards",
                        duration: 500,
                        delay: i*200,
                    }
                ).addEventListener("finish", finish, {once: true});
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(document.querySelector(".projects .title")).y + resolveCssValue("-70vh"),
            }),
        });

        element.querySelector(".link")?.animate(
            {opacity: ["0.3", "1", "0.3"]},
            {
                iterations: Infinity,
                delay: 1000,
                duration: 2000,
            }
        );
    });
}

function setupTransition(){
    const transitionText = document.querySelector(".transition-text");
    scrollUtils.registerListener({
        callback(a,b,c,finish,notFinish,progress){
            transitionText.querySelector("span").classList.remove("hidden");
            notFinish();
        },
        outsideCallback(){
            transitionText.querySelector("span").classList.add("hidden");
        },
        option: new ScrollUtilsOption({
            startY: PositionUtils.absPos(transitionText).y - resolveCssValue("20vh"),
            endY: PositionUtils.absPos(transitionText).y + resolveCssValue("20vh"),
        }),
    });
}