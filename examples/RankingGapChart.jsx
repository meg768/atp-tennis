import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

export const rankingGapData = [
	{ year: '2010', gap1to2: 3305, gap2to3: 3110, gap3to4: 275, gap4to5: 180 },
	{ year: '2011', gap1to2: 4035, gap2to3: 1425, gap3to4: 790, gap4to5: 2455 },
	{ year: '2012', gap1to2: 2655, gap2to3: 2265, gap3to4: 1310, gap4to5: 185 },
	{ year: '2013', gap1to2: 770, gap2to3: 6460, gap3to4: 10, gap4to5: 535 },
	{ year: '2014', gap1to2: 1585, gap2to3: 2940, gap3to4: 1465, gap4to5: 345 },
	{ year: '2015', gap1to2: 7640, gap2to3: 680, gap3to4: 1400, gap4to5: 1635 },
	{ year: '2016', gap1to2: 630, gap2to3: 6330, gap3to4: 135, gap4to5: 410 },
	{ year: '2017', gap1to2: 1040, gap2to3: 4455, gap3to4: 540, gap4to5: 595 },
	{ year: '2018', gap1to2: 1565, gap2to3: 1060, gap3to4: 35, gap4to5: 1085 },
	{ year: '2019', gap1to2: 840, gap2to3: 2555, gap3to4: 765, gap4to5: 120 },
	{ year: '2020', gap1to2: 2180, gap2to3: 725, gap3to4: 655, gap4to5: 1840 },
	{ year: '2021', gap1to2: 2900, gap2to3: 800, gap3to4: 1300, gap4to5: 1390 },
	{ year: '2022', gap1to2: 800, gap2to3: 200, gap3to4: 270, gap4to5: 730 },
	{ year: '2023', gap1to2: 2390, gap2to3: 1255, gap3to4: 1110, gap4to5: 1685 },
	{ year: '2024', gap1to2: 3915, gap2to3: 905, gap3to4: 1910, gap4to5: 70 },
	{ year: '2025', gap1to2: 550, gap2to3: 6390, gap3to4: 290, gap4to5: 630 },
	{ year: '2026', gap1to2: 1190, gap2to3: 7195, gap3to4: 485, gap4to5: 455 },
];

const SERIES = [
	{ key: 'gap1to2', name: '#1-#2', color: 'var(--color-success-500, #22c55e)' },
	{ key: 'gap2to3', name: '#2-#3', color: 'var(--color-warning-500, #f59e0b)' },
	{ key: 'gap3to4', name: '#3-#4', color: 'var(--color-sky-500, #0ea5e9)' },
	{ key: 'gap4to5', name: '#4-#5', color: 'var(--color-rose-500, #f43f5e)' },
];

function tooltipFormatter(value, _name, item) {
	return [`${value.toLocaleString()} points`, item.name];
}

export function RankingGapChart({ data = rankingGapData, height = 420 }) {
	return (
		<div style={{ width: '100%', height, fontFamily: 'Arial' }}>
			<ResponsiveContainer width='100%' height='100%'>
				<BarChart
					data={data}
					margin={{ top: 20, right: 24, bottom: 16, left: 8 }}
					barCategoryGap='18%'
				>
					<CartesianGrid strokeDasharray='2 2' stroke='var(--color-primary-400, #4b5563)' />
					<XAxis
						dataKey='year'
						tick={{ fill: 'currentColor', fontSize: 14, fontFamily: 'Arial' }}
					/>
					<YAxis tick={{ fill: 'currentColor', fontSize: 14, fontFamily: 'Arial' }} />
					<Tooltip
						formatter={tooltipFormatter}
						contentStyle={{
							fontFamily: 'Arial',
							backgroundColor: 'rgba(15, 23, 42, 0.95)',
							border: '1px solid rgba(148, 163, 184, 0.35)',
							borderRadius: '10px',
							color: '#e5e7eb',
						}}
					/>
					<Legend
						wrapperStyle={{
							paddingTop: '8px',
							fontFamily: 'Arial',
							fontSize: '14px',
						}}
					/>
					{SERIES.map((series) => (
						<Bar
							key={series.key}
							dataKey={series.key}
							name={series.name}
							stackId='year'
							fill={series.color}
							radius={series.key === 'gap4to5' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

export default RankingGapChart;
