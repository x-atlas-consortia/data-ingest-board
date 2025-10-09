import Icon from "@ant-design/icons";

const GroupedBarChartSvg = () => (
    <svg width="1em" height="1em" viewBox="0 0 12 12" >
      <g>
        <path fill="currentColor" d="M11.6,9.9H1.5V1.6c0-0.1,0-0.1-0.1-0.1H0.5c-0.1,0-0.1,0-0.1,0.1v9.2c0,0.1,0,0.1,0.1,0.1h11.1
		c0.1,0,0.1,0,0.1-0.1V10L11.6,9.9z"/>
        <rect x="2.7" y="2.8" fill="currentColor" width="1.2" height="6.5"/>
        <rect x="4.4" y="4.5" fill="#666666" width="1.4" height="4.9"/>
        <rect x="7.5" y="2.8" fill="currentColor" width="1.2" height="6.5"/>
        <rect x="9.1" y="4.1" fill="#666666" width="1.3" height="5.3"/>
      </g>
      
    </svg>
  )

export const GroupedBarChartIcon = props => <Icon component={GroupedBarChartSvg} {...props} />;