'use strict';
const e = React.createElement;

class CalendarDay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            day: props.day,
            dayNum: props.dayNum,
            checked: props.checked,
            svgParams: CalendarDay.getSvgParams(props),
            calendarOnly: props.calendarOnly,
            noText: props.noText
        }
    }

    render() {
        const p = this.state.svgParams;
        let fill = '#f9f9f9';
        let svg = <svg viewBox={p.viewBox} style={{background: '#fff', height: p.height + "px", width: p.width + "px", margin: p.margin + "px"}}>
            <rect x={p.dayRect.x} y={p.dayRect.y} height={p.dayRect.height} width={p.dayRect.width} fill={'dodgerblue'}/>
            <rect x={p.dayNumRect.x} y={p.dayNumRect.y} height={p.dayNumRect.height} width={p.dayNumRect.width}  fill={fill}/>
            {!this.state.noText ? <text x={p.day.x} y={p.day.y}
                  style={{fontSize: '96px', fontWeight: 250, fill: '#ffffff'}}>{this.state.day}</text> : null}
            <text x={p.dayNum.x} y={p.dayNum.y}
                  style={{fontSize: '336px', fontWeight: 250, fill: '#1e1e1e'}}>{this.state.dayNum}</text>
            { this.state.checked && !this.state.calendarOnly ? <path d={"M 200 475 L300 575 Q390 430,525 300"} stroke={"#6da134"} strokeWidth={"35"} fill={"none"} /> : null}
        </svg>;

        return svg;
    }

    static getSvgParams(props) {
        let p = {};
        let dayRect, dayNumRect, day, dayNum;
        let viewBoxW = 600;
        let viewBoxH = 600;
        let viewBox = '0 0 ' + viewBoxW + ' ' + viewBoxH;
        if (props.calendarOnly) {
            dayRect = {
                x: 0,
                y: 0,
                width: viewBoxW,
                height: 175
            };
            dayNumRect = {
                x: 0,
                y: dayRect.height,
                width: viewBoxW,
                height: 475
            };
            day = {
                x: viewBoxW / 2.85,
                y: 125,
            };
            dayNum = {
                x: 0,
                y: dayRect.height + dayNumRect.height / 1.5,
            };
        }else {
            dayRect = {
                x: 75,
                y: 0,
                width: 450,
                height: 125
            };
            dayNumRect = {
                x: 75,
                y: 125,
                width: 450,
                height: 350
            };
            day = {
                x: 600 / 2.85,
                y: 95,
            };
            dayNum = {
                x: 0,
                y: 125 + 350 / 1.25,
            };
        }


        if (props.dayNum === 11) {  //  special cases
            dayNum.x = viewBoxW / 4;
        } else if ([17, 21, 27, 31].indexOf(props.dayNum) !== -1) {
            dayNum.x = viewBoxW / 5;
        } else if (props.dayNum === 1) {
            dayNum.x = viewBoxW / 2.75;
        } else if (props.dayNum < 10) {
            dayNum.x = viewBoxW / 3;
        } else if (props.dayNum < 20) {
            dayNum.x = viewBoxW / 5;
        } else {
            dayNum.x = viewBoxW / 6;
        }

        p.dayRect = dayRect;
        p.dayNumRect = dayNumRect;
        p.viewBox = viewBox;
        p.day = day;
        p.dayNum = dayNum;
        p.height = props.height;
        p.width = props.height;     // 1:1 aspect ratio
        p.margin = props.margin || 10;

        return p;
    }
}

const rootElem = document.querySelector('#calendar-day-root');
if (rootElem) {
    ReactDOM.render(<CalendarDay height={100} day={'Wed'} dayNum={5} spent={62} checked={true}/>, rootElem);
}