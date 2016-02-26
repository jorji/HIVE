import React from "react"
import ReactDOM from "react-dom"
import Core from '../../../Core'

/**
 * ノードプロパティアイテム(Text)ビュー.
 */
export default class ItemText extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			param : this.props.initialParam,
			text : this.props.initialParam.value
		}
	}

	styles() {
		return {
			view : {
				width : "250px",
				backgroundColor : this.props.isHeader ? "#868686" : "#aeaeae",
				color : "black",
				display : "table-row"
			},
			key : {
				backgroundColor : this.props.isHeader ? "#868686" : "#ccc",
				width : "85px",
				display: "table-cell"
			},
			value : {
				width : "158px",
				display: "table-cell"
			}
		}
	}

	render () {
		const styles = this.styles.bind(this)();
		return (<div style={styles.view}>
					<div style={styles.key}>
						{this.state.param.name}
					</div>
					<div style={styles.value}>
						{this.state.param.hasOwnProperty('value') ? this.state.param.value : "(Object)"}
					</div>
				</div>);
	}
}