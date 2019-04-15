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
                <text style={{fontSize: params.fontSize}} x={params.spentLabel.x} y={params.spentLabel.y}>{params.spentLabel.text}</text>
                <text style={{fontSize: params.fontSize}}  x={params.spentAmount.x} y={params.spentAmount.y}>{params.spentAmount.text}</text>
                <text style={{fontSize: params.fontSize}}  x={params.budgetRem.x} y={params.budgetRem.y}>{params.budgetRem.text}</text>
            </svg>
        }else{
            svg = <svg viewBox={params.viewBox} style={{background: params.background, height: params.height + "px", width: params.width + "px"}}>
                <rect x={params.budgetRect.x} y={params.budgetRect.y} fill={params.budgetRect.fill} width={params.budgetRect.width} height={params.budgetRect.height}/>
                <rect x={params.spentRect.x} y={params.spentRect.y} fill={params.spentRect.fill} width={params.spentRect.width} height={params.spentRect.height}/>
                <text style={{fontSize: params.fontSize}}  x={params.spentLabel.x} y={params.spentLabel.y}>{params.spentLabel.text}</text>
                <text style={{fontSize: params.fontSize}}  x={params.spentAmount.x} y={params.spentAmount.y}>{params.spentAmount.text}</text>
                <text style={{fontSize: params.fontSize}}  x={params.budgetLabel.x} y={params.budgetLabel.y}>{params.budgetLabel.text}</text>
                <text style={{fontSize: params.fontSize}}  x={params.budgetAmount.x} y={params.budgetAmount.y}>{params.budgetAmount.text}</text>
                <text style={{fontSize: params.fontSize}}  x={params.budgetRem.x} y={params.budgetRem.y}>{params.budgetRem.text}</text>
            </svg>;
        }

        return svg;
    }
}


function getSVGParams(budget, spent, svgWidth, svgHeight) {

    let outOfBounds = false;
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
    if (rem < -250) outOfBounds = true;
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
    const viewBoxWidth = 300;
    const barWidth = 300;


    //  positions
    const xStart = viewBoxWidth / 2 - barWidth / 2;
    const goalTxtX = xStart - 100;
    const goalTxtY = viewBoxHeight - spentDim + 5;
    //  colors
    let budgetLeftBG = '#81D8AE';
    let budgetBG = '#42C486';
    let budgetRemStroke = 'darkgreen';

    let viewBox = "0 0 " + viewBoxWidth + " " + viewBoxHeight;
    const leftInBudget = budget - spent;
    const warningRangePct = .10;


    const brOffset = 60;
    let spentRect, budgetRect, budgetLabel, budgetAmount, spentAmount, spentLabel, budgetRem;

    if (leftInBudget > (warningRangePct * budget)) {
        //  under budget
        spentRect = {
            x: xStart,
            y: viewBoxHeight - spentDim,
            fill: budgetBG,
            width: barWidth,
            height: spentDim
        };

        budgetRect = {
            x: xStart,
            y: viewBoxHeight - spentDim - budgetRemDim,
            fill: budgetLeftBG,
            stroke: budgetRemStroke,
            width: barWidth,
            height: budgetRemDim
        };

        spentLabel = {
            text: 'Spent',
            x: goalTxtX,
            y: goalTxtY
        };

        spentAmount = {
            text: "$" + spent,
            x: xStart + barWidth + 10,
            y: goalTxtY
        };

        budgetLabel = {
            text: 'Budget',
            x: goalTxtX - 10,
            y: viewBoxHeight - spentDim - budgetRemDim + 5
        };

        budgetAmount = {
            text: "$" + budget,
            x: xStart + barWidth + 10,
            y: viewBoxHeight - spentDim - budgetRemDim + 5
        };

        budgetRem = {
            text: "$" + (budget - spent) + " left",
            x: xStart + barWidth / 2 - brOffset,
            y: viewBoxHeight - spentDim - budgetRemDim / 2 + 5
        };
        //  Bottom case adjust
        if(spentLabel.y >= viewBoxHeight - 2){
            spentAmount.y -= 12;
            spentLabel.y -= 12;
        }

    } else if (leftInBudget >= 0) {
        //  Warning range
        budgetLeftBG = 'lightgreen';
        budgetRemStroke = 'red';
        let txtYGoal = goalTxtY;
        let txtYBudget = viewBoxHeight - spentDim - budgetRemDim + 5;
        let showBudget = true;
        if (budgetRemDim < 15) {
            txtYGoal += 5;
            txtYBudget -= 5;
            if (budgetRemDim === 0) {
                showBudget = false;
            }
        }
        spentRect = {
            x: xStart,
            y: viewBoxHeight - spentDim,
            fill: budgetBG,
            width: barWidth,
            height: spentDim
        };

        if (showBudget) {
            budgetRect = {
                x: xStart,
                y: viewBoxHeight - spentDim - budgetRemDim,
                fill: budgetLeftBG,
                stroke: budgetRemStroke,
                width: barWidth,
                height: budgetRemDim
            };
        }

        spentLabel = {
            text: 'Spent',
            x: goalTxtX,
            y: txtYGoal
        };
        spentAmount = {
            text: "$" + spent,
            x: xStart + barWidth + 10,
            y: txtYGoal
        };

        if (showBudget) {
            budgetLabel = {
                text: 'Budget',
                x: goalTxtX - 10,
                y: txtYBudget
            };
            budgetAmount = {
                text: "$" + budget,
                x: xStart + barWidth + 10,
                y: txtYBudget
            };
        }
        /*  Left to Spend   */
        let heightLeft = viewBoxHeight - spentDim - budgetRemDim / 2 + 5;
        //  put outside rect if not enough room
        if (budgetRemDim < 15) heightLeft = viewBoxHeight - spentDim - budgetRemDim - 15;

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
            y: viewBoxHeight - spentDim,
            fill: 'salmon',
            stroke: 'red',
            width: barWidth,
            height: spentDim - budgetDim
        };

        budgetRect = {
            x: xStart,
            y: viewBoxHeight - budgetDim,
            fill: 'lightsalmon',
            width: barWidth,
            height: budgetDim
        };

        spentLabel = {
            text: 'Spent',
            x: goalTxtX,
            y: goalTxtY - yAdjust
        };
        spentAmount = {
            text: "$" + spent,
            x: xStart + barWidth + 10,
            y: goalTxtY - yAdjust
        };
        budgetLabel = {
            text: 'Budget',
            x: goalTxtX - 10,
            y: viewBoxHeight - spentDim - budgetRemDim + 5 + yAdjust
        };
        budgetAmount = {
            text: "$" + budget,
            x: xStart + barWidth + 10,
            y: viewBoxHeight - spentDim - budgetRemDim + 5 + yAdjust
        };

        /*  Left to Spend   */
        budgetRem = {
            text: "$" + Math.abs(budget - spent) + " over!",
            x: xStart + barWidth / 2 - brOffset,
            y: viewBoxHeight - spentDim - budgetRemDim / 2 + 5 - yAdjust * 5
        };

        if(spentRect.y - spentRect.height < 0){
            spentAmount.text = "^ " + spentAmount.text;
            spentRect.height += spentRect.y;
            spentRect.y = 0;
            budgetRem.y = 20;
            spentLabel.y = 20;
            spentAmount.y = 20;
        }

    }


    return {
        viewBox: viewBox,
        height: svgHeight,
        width: svgWidth,
        background: 'gainsboro',
        spentRect: spentRect,
        budgetRect: budgetRect,
        spentLabel: spentLabel,
        budgetLabel: budgetLabel,
        spentAmount: spentAmount,
        budgetAmount: budgetAmount,
        budgetRem: budgetRem,
        fontSize: '28px'
    };

}


let rootElem = document.querySelector('#budget-bar-root');
if(rootElem) {
    ReactDOM.render(<BudgetBar budget={100} spent={60} height={300} width={320}/>,
        rootElem);
}
