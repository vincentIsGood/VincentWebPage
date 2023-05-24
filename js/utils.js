class GeneralUtils{
    /**
     * @param {ArrayLike} arraylike 
     * @param {(element: HTMLElement, index: number)=>{}} callback 
     */
    static iterate(arraylike, callback){
        if(!callback) return;

        for(let i = 0; i < arraylike.length; i++){
            callback(arraylike[i], i);
        }
    }

    /**
     * @param {HTMLElement} clickElement 
     * @param {HTMLElement} targetElement if null, clickElement is used
     * @param {string} className
     */
    static registerCssClassToggle(clickElement, targetElement, className){
        if(!clickElement) return;
        if(!targetElement) targetElement = clickElement;
        
        clickElement.addEventListener("click", ()=>{
            targetElement.classList.toggle(className);
        });
    }
}

class PositionUtils{
    /**
     * Get absolute position (often, relative to document.body)
     * @param {HTMLElement} targetElement
     * @param {HTMLElement} relativeElement if null, body is used
     */
    static absPos(targetElement, relativeElement){
        if(!targetElement) throw new Error("Invalid target element");
        if(!relativeElement) relativeElement = document.body;

        let targetEleRect = targetElement.getBoundingClientRect();
        let relativeEleRect = relativeElement.getBoundingClientRect();
        return {
            x: targetEleRect.x - relativeEleRect.x, 
            y: targetEleRect.y - relativeEleRect.y,
        };
    }

    /**
     * @param {HTMLElement} targetElement
     * @param {HTMLElement} relativeElement if null, body is used
     */
    static centerPos(targetElement, relativeElement){
        if(!targetElement) throw new Error("Invalid target element");
        let pos = PositionUtils.absPos(targetElement, relativeElement);
        let targetEleRect = targetElement.getBoundingClientRect();
        return {
            x: pos.x + targetEleRect.width/2,
            y: pos.y + targetEleRect.height/2,
        };
    }

    /**
     * @param {HTMLElement} targetElement
     * @param {{x: number, y: number}} targetPos
     */
    static offsetToPos(targetElement, targetPos, originallyTopLeftOrigin = true){
        if(!targetElement) throw new Error("Invalid target element");
        let abs = PositionUtils.absPos(targetElement);
        let targetRect = targetElement.getBoundingClientRect();
        return {
            x: resolveCssValue(targetPos.x) - abs.x - (originallyTopLeftOrigin? targetRect.width/2 : 0),
            y: resolveCssValue(targetPos.y) - abs.y - (originallyTopLeftOrigin? targetRect.height/2 : 0),
        };
    }

    static offsetToCenter(sourceElement, elementForCenter, offset = {x: 0, y: 0}){
        if(!sourceElement) throw new Error("Invalid source element");
        let center = PositionUtils.centerPos(elementForCenter);
        let pos = {
            x: center.x + resolveCssValue(offset.x), 
            y: center.y + resolveCssValue(offset.y)
        };
        return PositionUtils.offsetToPos(sourceElement, pos);
    }
}

class ScrollUtilsOption{
    /**
     * px or rem
     * @type {string}
     */
    startStr;

    /**
     * px or rem
     * @type {string}
     */
    endStr;

    /**
     * @type {number} ms
     */
    delay;

    constructor({startY = null, endY = null, delay = 0}){
        this.startStr = startY;
        this.endStr = endY;
        this.delay = delay;
    }

    hasStart(){
        return this.startStr != null;
    }
    hasEnd(){
        return this.endStr != null;
    }

    /**
     * @returns {number}
     */
    start(){
        return this.startStr = resolveCssValue(this.startStr);
    }

    /**
     * @returns {number}
     */
    end(){
        return this.endStr = resolveCssValue(this.endStr);
    }
}

class ListenerCallback{
    /**
     * @type {(scrollY: number, relativeYFromStart: number, relativeYFromEnd: number, finish: Function)=>{}}
     */
    callback;
    /**
     * @type {ScrollUtilsOption}
     */
    option;
}

class ScrollUtils{
    constructor(){
        /**
         * @type {ListenerCallback[]}
         */
        this.listeners = [];
    }

    registerDocumentScroll(){
        document.addEventListener("scroll", ()=>{this.scrollHandler()});
        this.scrollHandler();
    }

    scrollHandler(){
        let scrollY = window.scrollY;
        for(let i = this.listeners.length-1; i >= 0; i--){
            let listener = this.listeners[i];
            let listenerOption = listener.option;
            let finishFunction = ()=>{
                this.listeners.splice(i, 1);
            }

            // run on no option as well
            if(!listenerOption || (!listenerOption.hasStart() && !listenerOption.hasEnd())
            || (listenerOption.hasStart() && listenerOption.hasEnd() && scrollY >= listenerOption.start() && scrollY <= listenerOption.end())
            || (listenerOption.hasStart() && !listenerOption.hasEnd() && scrollY >= listenerOption.start())
            || (!listenerOption.hasStart() && listenerOption.hasEnd() && scrollY <= listenerOption.start())){
                if(!listener.callback) continue;

                if(listenerOption.delay > 0){
                    setTimeout(()=>{
                        listener.callback(
                            scrollY, 
                            listenerOption.hasStart()? listenerOption.start() - scrollY : null, 
                            listenerOption.hasEnd()? listenerOption.end() - scrollY : null,
                            finishFunction);
                    }, listenerOption.delay);
                    continue;
                }

                listener.callback(
                    scrollY, 
                    listenerOption.hasStart()? listenerOption.start() - scrollY : null, 
                    listenerOption.hasEnd()? listenerOption.end() - scrollY : null,
                    finishFunction);
                continue;
            }
        }
    }

    /**
     * `callback` of the listener will be called according to the `options` variable.
     * If no options are available, callback will be invoked when `scroll` happens.
     * @param {ListenerCallback} listener
     */
    registerListener(listener){
        this.listeners.push(listener);
    }
}

class AnimationUtils{
    /**
     * @param {HTMLElement} targetElement
     */
    static initCharacters(targetElement){
        AnimationUtils.chopWordsToElements(targetElement);
        GeneralUtils.iterate(targetElement.querySelectorAll(".char-wrapper span"), (element)=>{
            element.style.transform = "translateY(4rem)";
        });
    }

    /**
     * @param {HTMLElement} targetElement
     */
    static animateCharacters(targetElement, interCharDelay = 100){
        GeneralUtils.iterate(targetElement.querySelectorAll(".char-wrapper span"), (element, i)=>{
            element.animate({
                transform: ["translateY(4rem)", "translateY(0)"],
            }, {
                fill: "forwards",
                delay: interCharDelay*i,
                duration: interCharDelay,
            });
        });
    }

    /* These are needed to style the chopped up the words
        .example{
            overflow: hidden;
            word-wrap: break-word;
        }
        .char-wrapper{
            position: relative;
            display: inline-block;
        }
    */
    /**
     * Takes an element and convert text excluding text from childs
     * to `span` html.
     * @param {Element | NodeList | string} element 
     */
    static chopWordsToElements(ele){
        if(!ele) return;
        if(ele instanceof NodeList){
            for(let element of ele){
                AnimationUtils.chopWordsToElements(element);
            }
            return;
        }
        let element = ele;
        if(!element instanceof Element)
            element = document.querySelector(ele);

        let spaceEncountered = false;
        let newLine = false;
        let result = "<span class='char-wrapper'>";
        for(let char of AnimationUtils.getTextFromElement(element).trim()){
            char = char.trim();
            if(char === "" && !spaceEncountered){
                spaceEncountered = true;
                result += "</span>"; // close char-wrapper
                result += "<pre class='space char-wrapper'> </pre>";
                if(newLine){
                    result += "<br><br>";
                    newLine = false;
                }
                result += `<span class='char-wrapper'>`;
            }else if(char !== ""){
                spaceEncountered = false;
                if(char === "`"){
                    newLine = true;
                }else result += "<span>" + char + "</span>";
            };
        }
        for(let i = 0; i < element.childNodes.length; i++)
            if(element.childNodes[i].nodeType === Node.TEXT_NODE)
                element.removeChild(element.childNodes[i]);
        const newDiv = document.createElement("div");
        newDiv.innerHTML = result + "</span>"; // close char-wrapper
        element.appendChild(newDiv);
    }
    static getTextFromElement(element){
        let text = "";
        for (var i = 0; i < element.childNodes.length; i++)
            if (element.childNodes[i].nodeType === Node.TEXT_NODE)
                text += element.childNodes[i].textContent;
        return text;
    }
}

class ScrollTemplates{
    /**
     * @param {ScrollUtils} scrollUtils 
     * @param {HTMLElement} targetElement 
     */
    static animateCharactersAt(scrollUtils, targetElement, delay = 0, startOffsetY = 0){
        scrollUtils.registerListener({
            callback: (a, b, c, finish)=>{
                AnimationUtils.animateCharacters(targetElement);
                finish();
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(targetElement).y + resolveCssValue(startOffsetY),
                delay,
            }),
        });
    }
}

/**
 * @param {string | number} strCss px or rem 
 * @returns {number}
 */
function resolveCssValue(strCss){
    if(strCss == null) return 0;
    if(typeof(strCss) === "number")
        return strCss;
    if(strCss.endsWith("rem")){
        return parseFloat(strCss) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    if(strCss.endsWith("vw")){
        return parseFloat(strCss)/100 * window.innerWidth;
    }
    if(strCss.endsWith("vh")){
        return parseFloat(strCss)/100 * window.innerHeight;
    }
    return parseFloat(strCss);
}

export {
    resolveCssValue,
    GeneralUtils, 
    PositionUtils, 
    ScrollUtils, 
    ScrollUtilsOption, 
    AnimationUtils, 
    ScrollTemplates
};