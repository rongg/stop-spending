'use strict';

const e = React.createElement;

class CalendarRow extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            cDayOfMonth: props.dayOfMonth,
            cDayOfWeek: props.dayOfWeek,
            days: CalendarRow.generateDays(props.weekStart, props.dayOfMonth)
        };
    }

    render(){
        return <div className="col-md-12">
            {this.state.days.map((day, index) => (
                <div key={index} className="d-inline-block" style={{textAlign: 'center', verticalAlign: 'top'}}>
                    <CalendarDay day={day.day} dayNum={day.num} checked={day.checked} height={100} calendarOnly={day.today}/>
                    <br/>
                    {day.num < this.state.cDayOfMonth ? <span style={{padding: '2px 27px',
                        background: 'dodgerblue',
                        color: '#fff'}}>${day.spent}</span> : null}
                    {day.num === this.state.cDayOfMonth ? <span style={{padding: '2px 27px',
                        background: '#ff8d1e',
                        color: '#fff'}}>Today!</span> : null}
                </div>
            ))}
        </div>
    }

    static generateDays(weekStart, currentDayNum){
        let days = [
            {day: 'Mon', num: weekStart},
            {day: 'Tue', num: weekStart + 1},
            {day:'Wed', num: weekStart + 2},
            {day: 'Thur', num: weekStart + 3},
            {day:'Fri', num: weekStart + 4},
            {day:'Sat', num: weekStart + 5},
            {day:'Sun', num: weekStart + 6}];
        days.map((e) =>{
            e.checked = e.num < currentDayNum;
            e.today = e.num === currentDayNum;
            e.spent = Math.round(Math.random() * 200);
        });

        return days;
    }
}

const currentDay = {
    dayOfMonth: 18,
    weekStart: 15
};

const rootElem = document.querySelector('#calendar-row-root');
if (rootElem) {
    ReactDOM.render(<CalendarRow dayOfMonth={currentDay.dayOfMonth} dayOfWeek={currentDay.dayOfWeek} weekStart={currentDay.weekStart}/>, rootElem);
}