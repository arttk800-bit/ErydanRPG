export const MAP_METRICS={
 'region:forest':{widthMeters:120000,heightMeters:80000,source:'regional-geography-v1'},
 'location:veligrad':{widthMeters:2500,heightMeters:1667,source:'city-visual-estimate-v1'}
};
export function mapMetrics(kind,id){return MAP_METRICS[kind+':'+id]||null}
