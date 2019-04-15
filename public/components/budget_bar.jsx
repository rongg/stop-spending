'use strict';
const e = React.createElement;
class BudgetBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            budget: props.budget,
            spent: props.spent,
            svgParams: getSVGParams(props.budget, props.spent, props.width, props.height)
        }
    }

    render() {
        let svg;
        const params = this.state.svgParams;
        if(this.state.budget === this.state.spent){
            svg = <svg viewBox={params.viewBox} style={{background: params.background, height: params.height + "px", width: params.width + "px"}}>
                <rect x={params.spentRect.x} y={params.spentRect.y} fill={params.spentRect.fill} width={params.spentRect.width} height={params.spentRect.height}/>
                <text style={{fontSize: params.fontSize}}  x={params.budgetRem.x} y={params.budgetRem.y}>{params.budgetRem.text}</text>
            </svg>
        }else{
            svg = <svg viewBox={params.viewBox} style={{background: params.background, height: params.height + "px", width: params.width + "px"}}>
                <rect x={params.budgetRect.x} y={params.budgetRect.y} fill={params.budgetRect.fill} width={params.budgetRect.width} height={params.budgetRect.height}/>
                <rect x={params.spentRect.x} y={params.spentRect.y} fill={params.spentRect.fill} width={params.spentRect.width} height={params.spentRect.height}/>
                <text style={{fontSize: params.fontSize}}  x={params.budgetRem.x} y={params.budgetRem.y}>{params.budgetRem.text}</text>
            </svg>;
        }

        return svg;
    }
}


function getSVGParams(budget, spent, svgWidth, svgHeight) {

    let scale = 1;
    if (budget <= 25) {
        scale *= 14;
    } else if (budget <= 50) {
        scale *= 8;
    } else if (budget <= 75) {
        scale *= 6;
    } else if (budget <= 100) {
        scale *= 4;
    } else if (budget <= 200) {
        scale *= 1.75;
    } else if (budget <= 500) {
        scale *= .7;
    } else if (budget <= 1000) {
        scale *= .35;
    }

    //  Scale graph height for over budget case
    const rem = budget - spent;
    if (rem <= -100) scale *= .125;
    else if (rem <= -50) scale *= .25;
    else if (rem <= -25) scale *= .5;
    else if (rem <= -5) scale *= .65;
    if (budget >= 100 && rem <= -25) {
        scale *= 2;
        if (budget >= 200 && rem <= -100) scale *= 2;
    }

    const budgetDim = budget * scale;
    const spentDim = spent * scale;
    const budgetRemDim = (budget - spent) * scale;
    const viewBoxHeight = 500;
    const viewBoxWidth = 400;
    const barWidth = 400;


    //  positions
    const xStart = viewBoxWidth / 2 - barWidth / 2;
    const y1 = 0;
    const y2 = rem / budget * viewBoxHeight;

    //  colors
    let budgetLeftBG = '#81D8AE';
    let budgetBG = '#42C486';
    let budgetRemStroke = 'darkgreen';

    let viewBox = "0 0 " + viewBoxWidth + " " + viewBoxHeight;
    const leftInBudget = budget - spent;
    const warningRangePct = .10;


    const brOffset = 55;
    let spentRect, budgetRect, budgetRem;

    if (leftInBudget > (warningRangePct * budget)) {
        //  under budget
        spentRect = {
            x: xStart,
            y: y2,
            fill: budgetBG,
            width: barWidth,
            height: viewBoxHeight - y2
        };

        budgetRect = {
            x: xStart,
            y: y1,
            fill: budgetLeftBG,
            stroke: budgetRemStroke,
            width: barWidth,
            height: y2
        };

        budgetRem = {
            text: "$" + (budget - spent) + " left",
            x: xStart + barWidth / 2 - brOffset,
            y: y2 / 2 + 5
        };

    } else if (leftInBudget >= 0) {
        //  Warning range
        budgetLeftBG = 'lightgreen';
        budgetRemStroke = 'red';
        let showBudget = true;
        if (budgetRemDim < 15) {
            if (budgetRemDim === 0) {
                showBudget = false;
            }
        }
        spentRect = {
            x: xStart,
            y: y2,
            fill: budgetBG,
            width: barWidth,
            height: viewBoxHeight - y2
        };

        if (showBudget) {
            budgetRect = {
                x: xStart,
                y: 0,
                fill: budgetLeftBG,
                stroke: budgetRemStroke,
                width: barWidth,
                height: y2
            };
        }

        /*  Left to Spend   */
        let heightLeft = y2 / 2 + 10;
        if(heightLeft < 25) heightLeft = 30;

        budgetRem = {
            text: "$" + (budget - spent) + " left",
            fill: 'red',
            x: xStart + barWidth / 2 - brOffset,
            y: heightLeft
        };
    } else {
        //  Over budget
        let yAdjust = 5;
        if (Math.abs(budget - spent) / budget > .10) yAdjust = 0;
        spentRect = {
            x: xStart,
            y: 0,
            fill: 'salmon',
            stroke: 'red',
            width: barWidth,
            height: viewBoxHeight
        };

        budgetRect = {
            x: xStart,
            y: 0,
            fill: 'lightsalmon',
            width: barWidth,
            height: 0
        };

        /*  Left to Spend   */
        budgetRem = {
            text: "$" + Math.abs(budget - spent) + " over!",
            x: xStart + barWidth / 2 - brOffset,
            y: 25
        };

    }


    return {
        viewBox: viewBox,
        height: svgHeight,
        width: svgWidth,
        background: '#f5f5f5',
        spentRect: spentRect,
        budgetRect: budgetRect,
        budgetRem: budgetRem,
        fontSize: '28px'
    };

}


let rootElem = document.querySelector('#budget-bar-root');
if(rootElem) {
    ReactDOM.render(<BudgetBar budget={75} spent={33} height={300} width={240}/>,
        rootElem);
}
