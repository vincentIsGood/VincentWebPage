class GeneralUtils{
    /**
     * @param {ArrayLike} arraylike 
     * @param {(element: HTMLElement, index: number, length: number)=>{}} callback 
     */
    static iterate(arraylike, callback){
        if(!callback) return;

        for(let i = 0; i < arraylike.length; i++){
            callback(arraylike[i], i, arraylike.length);
        }
    }

    /**
     * @param {HTMLElement} clickElement 
     * @param {HTMLElement} targetElement if null, clickElement is used
     * @param {string} className
     */
    static registerCssClassToggleClick(clickElement, targetElement, className, propagate = true){
        if(!clickElement) return;
        if(!targetElement) targetElement = clickElement;
        
        clickElement.addEventListener("click", (e)=>{
            if(!propagate) e.stopPropagation();
            targetElement.classList.toggle(className);
        });
    }

    /**
     * When you hover into an element, a class from the element is DELETED. Otherwise, ADDED
     * @param {HTMLElement} hoverInOutElement
     * @param {HTMLElement} targetElement if null, clickElement is used
     * @param {string} className
     */
    static registerCssClassToggleHover(hoverInOutElement, targetElement, className){
        if(!hoverInOutElement) return;
        if(!targetElement) targetElement = hoverInOutElement;
        
        hoverInOutElement.addEventListener("mouseenter", ()=>{
            targetElement.classList.remove(className);
        });
        hoverInOutElement.addEventListener("mouseleave", ()=>{
            targetElement.classList.add(className);
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

    /**
     * @type {boolean}
     */
    isInitSameAsOutside;

    constructor({startY = null, endY = null, delay = 0, isInitSameAsOutside = false}){
        if(startY != null && typeof(startY) != "number" && typeof(startY) != "string") 
            console.warn("startY is neither a number NOR string");
        if(endY != null && typeof(endY) != "number" && typeof(endY) != "string") 
            console.warn("endY is neither a number NOR string");
        this.startStr = startY;
        this.endStr = endY;
        this.delay = delay;
        this.isInitSameAsOutside = isInitSameAsOutside;
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

    /**
     * @returns {number} -1 if end is not defined
     */
    length(){
        if(!this.hasEnd()) return -1;
        return this.end() - this.start();
    }
}

/**
 * Scrolling listener
 */
class ListenerCallback{
    /**
     * [Optional] Callback which will be called on register. `receivedOptions` depends on your `options` 
     * argument. `null` if you passed in a `null` value
     * @type {(receivedOptions: ScrollUtilsOption)=>{}}
     */
    initCallback;

    /**
     * If you are doing animations, you are recommended to addEventListener on its finish event.
     * (eg. `Animation.addEventListener("finish", finish);`). 
     * @param {Function} finish `finish()` sets `finished` to `true`
     * @param {Function} notFinish `notFinish()` will keep this listener's `running` to `false`, 
     *                             so that this listener can run again next time you scroll
     * @param {number} progress -1 if `endY` is not defined. It indicates how far it is from `scrollY` to `endY` in percentage
     * @type {(scrollY: number, relativeYFromStart: number, relativeYFromEnd: number, finish: Function, notFinish: Function, progress: number)=>{}}
     */
    callback;
    /**
     * @type {ScrollUtilsOption}
     */
    option;

    /**
     * [Optional] Called once when scroll is not in range (after being in range). Delay does not affect 
     * this callback
     * @type {(scrollY: number, relativeYFromStart: number, relativeYFromEnd: number)=>{}}
     */
    outsideCallback;

    outsideCalled = false;

    /**
     * Whether the callback has started. To stop it, 
     * use `notFinish()` / `finish()` provided in the callback.
     * 
     * If false, the callback will be run again. It is useful
     * when doing scrolling animations with constant updates.
     * @type {boolean}
     */
    running = false;

    /**
     * Indicates the use of this listener is finished.
     * Listener is then removed from the `listeners` array.
     */
    finished = false;

    /**
     * This builder is another option to create the same thing.
     * @param {ScrollUtilsOption} options 
     */
    static builder(options){
        return new ListenerCallbackBuilder(options);
    }
}

class ListenerCallbackBuilder{
    /**
     * @param {ScrollUtilsOption} options 
     */
    constructor(options){
        this.callbackInstance = new ListenerCallback();
        this.callbackInstance.option = options;
    }

    /**
     * @param {(receivedOptions: ScrollUtilsOption)=>{}} func 
     */
    initCallback(func){
        this.callbackInstance.initCallback = func;
    }

    /**
     * @param {(scrollY: number, relativeYFromStart: number, relativeYFromEnd: number, finish: Function, notFinish: Function)=>{}} func 
     */
    callback(func){
        this.callbackInstance.callback = func;
    }

    /**
     * @param {(scrollY: number, relativeYFromStart: number, relativeYFromEnd: number)=>{}} func 
     */
    outsideCallback(func){
        this.callbackInstance.outsideCallback = func;
    }

    build(){
        return this.callbackInstance;
    }
}

/**
 * Vertical scroll only. Remember to call {@link ScrollUtils.registerDocumentScroll}
 */
class ScrollUtils{
    constructor(){
        /**
         * @type {ListenerCallback[]}
         */
        this.listeners = [];
    }

    registerDocumentScroll(){
        document.addEventListener("scroll", ()=>{this.scrollHandler()});
        
        // call this once to simulate a scroll
        this.scrollHandler();
    }
    
    scrollHandler(){
        let scrollY = window.scrollY;
        for(let i = this.listeners.length-1; i >= 0; i--){
            let listener = this.listeners[i];
            // delete it if it is finished
            if(listener.finished){
                this.listeners.splice(i, 1);
                continue;
            }
        }
        for(let i = this.listeners.length-1; i >= 0; i--){
            let listener = this.listeners[i];
            let listenerOption = listener.option;
            
            if(listener.running || listener.finished) continue;

            // run on no option as well
            if(!listenerOption || (!listenerOption.hasStart() && !listenerOption.hasEnd())
            || (listenerOption.hasStart() && listenerOption.hasEnd() && scrollY >= listenerOption.start() && scrollY <= listenerOption.end())
            || (listenerOption.hasStart() && !listenerOption.hasEnd() && scrollY >= listenerOption.start())
            || (!listenerOption.hasStart() && listenerOption.hasEnd() && scrollY <= listenerOption.start())){
                listener.outsideCalled = false;
                listener.running = true;
                
                let finishFunction = ()=>{
                    listener.finished = true;
                    listener.running = false;
                }
                let notFinishFunction = ()=>{
                    listener.running = false;
                }

                if(listenerOption.delay > 0){
                    setTimeout(()=>{
                        listener.callback(
                            scrollY, 
                            listenerOption.hasStart()? listenerOption.start() - scrollY : null, 
                            listenerOption.hasEnd()? listenerOption.end() - scrollY : null,
                            finishFunction, notFinishFunction,
                            listenerOption.hasEnd()? ((scrollY - listenerOption.start()) / listenerOption.length()) : -1
                        );
                    }, listenerOption.delay);
                    continue;
                }
                
                listener.callback(
                    scrollY, 
                    listenerOption.hasStart()? listenerOption.start() - scrollY : null, 
                    listenerOption.hasEnd()? listenerOption.end() - scrollY : null,
                    finishFunction, notFinishFunction,
                    listenerOption.hasEnd()? ((listenerOption.end() - scrollY) / listenerOption.length()) : -1
                );
                continue;
            }else if(!listener.outsideCalled){
                // if user is not in scroll area, `outside` callback will be called, ONCE.
                listener.outsideCalled = true;
                listener.outsideCallback && listener.outsideCallback(
                    scrollY, 
                    listenerOption.hasStart()? listenerOption.start() - scrollY : null, 
                    listenerOption.hasEnd()? listenerOption.end() - scrollY : null);
            }
        }
    }

    /**
     * `callback` of the listener will be called according to the `options` variable.
     * If no options are available, callback will be invoked when `scroll` happens.
     * @param {ListenerCallback} listener
     */
    registerListener(listener){
        if(!listener.callback) return;
        if(!listener.initCallback && listener.option?.isInitSameAsOutside)
            listener.initCallback = listener.outsideCallback;
        listener.initCallback && listener.initCallback(listener.option);
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
            element.style.transform = "translateY(10rem)";
        });
    }

    /**
     * @param {HTMLElement} targetElement
     * @param {Function} finish function to be called to indicate animation finish
     */
    static animateCharacters(targetElement, finish, interCharDelay = 100){
        GeneralUtils.iterate(targetElement.querySelectorAll(".char-wrapper span"), (element, i)=>{
            element.animate({
                transform: ["translateY(10rem)", "translateY(0)"],
            }, {
                fill: "forwards",
                delay: interCharDelay*i,
                duration: interCharDelay,
            }).addEventListener("finish", finish, {once: true});
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
                AnimationUtils.animateCharacters(targetElement, finish);
            },
            option: new ScrollUtilsOption({
                startY: PositionUtils.absPos(targetElement).y + resolveCssValue(startOffsetY),
                delay
            }),
        });
    }
}

/**
 * @param {string | number} strCss (eg. 123px, rem, vw, vh) 
 * @returns {number} in pixels
 */
function resolveCssValue(strCss){
    if(strCss == null) return 0;
    if(typeof(strCss) === "number")
        return strCss;
    if(strCss.endsWith("rem")){
        return parseFloat(strCss) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    if(strCss.endsWith("vw")){
        return parseFloat(strCss)/100 * window.outerWidth;
    }
    if(strCss.endsWith("vh")){
        return parseFloat(strCss)/100 * window.outerHeight;
    }
    return parseFloat(strCss);
}

export {
    resolveCssValue,
    GeneralUtils, 
    PositionUtils, 
    ScrollUtils, 
    ScrollUtilsOption, 
    ListenerCallbackBuilder,
    ListenerCallback,
    AnimationUtils, 
    ScrollTemplates
};