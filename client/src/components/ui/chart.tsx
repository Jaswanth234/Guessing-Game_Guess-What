import React from "react";

interface ChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      tension?: number;
    }[];
  };
  options?: any;
}

export function BarChart({ data, options }: ChartProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center p-6 bg-gray-50 rounded-lg w-full h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium mb-4">Bar Chart Visualization</h3>
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="w-full bg-gray-100 p-4 rounded relative">
            {data.labels.map((label, index) => (
              <div key={index} className="flex items-end mb-2 h-8">
                <div className="w-20 text-sm text-gray-600 truncate pr-2">{label}</div>
                <div 
                  className="bg-primary rounded h-6" 
                  style={{ 
                    width: `${(data.datasets[0].data[index] / Math.max(...data.datasets[0].data)) * 60}%`,
                    backgroundColor: Array.isArray(data.datasets[0].backgroundColor) 
                      ? data.datasets[0].backgroundColor[index] 
                      : data.datasets[0].backgroundColor
                  }}
                >
                  <span className="text-xs text-white px-2 leading-6">{data.datasets[0].data[index]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-medium">{data.datasets[0].label}</span>
        </div>
      </div>
    </div>
  );
}

export function LineChart({ data, options }: ChartProps) {
  const maxValue = Math.max(...data.datasets[0].data);
  const minValue = Math.min(...data.datasets[0].data);
  const range = maxValue - minValue;
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center p-6 bg-gray-50 rounded-lg w-full h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium mb-4">Line Chart Visualization</h3>
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="w-full bg-gray-100 p-4 rounded relative h-60">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={data.datasets[0].data.map((value, index) => {
                  const x = (index / (data.datasets[0].data.length - 1)) * 100;
                  const normalizedValue = range === 0 
                    ? 50 
                    : 100 - ((value - minValue) / range) * 80 - 10;
                  return `${x},${normalizedValue}`;
                }).join(' ')}
                fill="none"
                stroke={data.datasets[0].borderColor || "currentColor"}
                strokeWidth="2"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
              {data.labels.map((label, index) => (
                <div key={index} className="truncate" style={{maxWidth: "60px"}}>{label}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-medium">{data.datasets[0].label}</span>
        </div>
      </div>
    </div>
  );
}

export function PieChart({ data, options }: ChartProps) {
  const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
  
  let cumulativePercent = 0;
  const slices = data.datasets[0].data.map((value, index) => {
    const percent = (value / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    
    return {
      percent,
      startPercent,
      endPercent: cumulativePercent,
      color: Array.isArray(data.datasets[0].backgroundColor) 
        ? data.datasets[0].backgroundColor[index] 
        : data.datasets[0].backgroundColor,
      label: data.labels[index],
      value
    };
  });
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center p-6 bg-gray-50 rounded-lg w-full h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium mb-4">Pie Chart Visualization</h3>
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="relative" style={{ width: "200px", height: "200px" }}>
            <svg width="100%" height="100%" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e9e9e9" strokeWidth="2"></circle>
              
              {slices.map((slice, index) => {
                const startAngle = (slice.startPercent / 100) * 360;
                const endAngle = (slice.endPercent / 100) * 360;
                
                const x1 = 21 + 15.91549430918954 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 21 + 15.91549430918954 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 21 + 15.91549430918954 * Math.cos((endAngle - 90) * Math.PI / 180);
                const y2 = 21 + 15.91549430918954 * Math.sin((endAngle - 90) * Math.PI / 180);
                
                const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
                
                const pathData = [
                  `M 21 21`,
                  `L ${x1} ${y1}`,
                  `A 15.91549430918954 15.91549430918954 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  `Z`
                ].join(' ');
                
                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={slice.color || `hsl(${index * 360 / slices.length}, 70%, 60%)`}
                  ></path>
                );
              })}
              
              <circle cx="21" cy="21" r="10" fill="white"></circle>
            </svg>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-left">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 mr-2 rounded" 
                style={{ backgroundColor: slice.color || `hsl(${index * 360 / slices.length}, 70%, 60%)` }}
              ></div>
              <span>{slice.label}: {slice.value} ({slice.percent.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}