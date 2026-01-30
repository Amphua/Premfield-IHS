import React from 'react';
import '../styles/main.css';

const RadialChart = ({ studentStats }) => {
  // Calculate percentages for chart
  const getPercentage = (count, total) => {
    if (!total || total === 0) return '0';
    return ((count / total) * 100).toFixed(0);
  };

  const maleCount = studentStats?.gender_stats?.find(stat => stat.gender === 'male')?.count || 0;
  const femaleCount = studentStats?.gender_stats?.find(stat => stat.gender === 'female')?.count || 0;
  const totalCount = studentStats?.total_students || 0;

  const malePercentage = getPercentage(maleCount, totalCount);
  const femalePercentage = getPercentage(femaleCount, totalCount);

  // Calculate conic gradient for circular chart
  const conicGradient = `conic-gradient(
    #0f5298 0deg ${malePercentage * 3.6}deg,
    #fa8072 ${malePercentage * 3.6}deg ${(parseInt(malePercentage) + parseInt(femalePercentage)) * 3.6}deg,
    #f3f4f6 ${(parseInt(malePercentage) + parseInt(femalePercentage)) * 3.6}deg 360deg
  )`;

  return (
    <div className="radial-chart-container-wide">
      <div className="radial-chart-header">
        <h2 className="radial-chart-title">Student Statistics</h2>
        <div className="radial-chart-icon">📊</div>
      </div>
      
      <div className="radial-chart-body-wide">
        <div className="radial-chart-left">
          <div className="circular-chart" style={{ background: conicGradient }}>
            <div className="circular-chart-hole">
              <div className="radial-chart-center-icon">👥</div>
              <div className="radial-chart-center-text">{totalCount}</div>
              <div className="radial-chart-center-label">Total Students</div>
            </div>
          </div>
        </div>
        
        <div className="radial-chart-right">
          <div className="radial-stats-grid">
            <div className="radial-stat-card">
              <div className="radial-stat-header">
                <div className="radial-stat-icon" style={{ backgroundColor: '#0f5298' }}>
                  👦
                </div>
                <div className="radial-stat-title">Male Students</div>
              </div>
              <div className="radial-stat-content">
                <div className="radial-stat-number">{maleCount}</div>
                <div className="radial-stat-percentage">{malePercentage}%</div>
                <div className="radial-stat-bar">
                  <div className="radial-stat-bar-fill" style={{ width: `${malePercentage}%`, backgroundColor: '#0f5298' }}></div>
                </div>
              </div>
            </div>
            
            <div className="radial-stat-card">
              <div className="radial-stat-header">
                <div className="radial-stat-icon" style={{ backgroundColor: '#fa8072' }}>
                  👧
                </div>
                <div className="radial-stat-title">Female Students</div>
              </div>
              <div className="radial-stat-content">
                <div className="radial-stat-number">{femaleCount}</div>
                <div className="radial-stat-percentage">{femalePercentage}%</div>
                <div className="radial-stat-bar">
                  <div className="radial-stat-bar-fill" style={{ width: `${femalePercentage}%`, backgroundColor: '#fa8072' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="radial-chart-summary">
            <div className="summary-item">
              <span className="summary-label">Total Classes:</span>
              <span className="summary-value">{studentStats?.class_stats?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadialChart;
