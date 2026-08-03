# NetAScore4Teens
**Streets for Young People**: An interactive map dashboard scoring how walkable and bikeable streets are for teenagers, in Salzburg (Austria) and Olomouc (Czechia).

This dashboard visualizes results produced by the [NetAScore for Children](https://github.com/urbanistamna/netascore_children) pipeline; a modified version of the [NetAScore](https://github.com/plus-mobilitylab/netascore) walkability/bikeability indicator tool, adapted to reflect how teenagers and children experience street networks (safety, comfort, and joy indicators derived from OpenStreetMap and Copernicus land-use/land-cover data).

# Data Sources

- **Network indicators & scoring**: [urbanistamna/netascore_children](https://github.com/urbanistamna/netascore_children)
- **Base network model**: [plus-mobilitylab/netascore](https://github.com/plus-mobilitylab/netascore)
- **Land use / land cover & street tree layers**: Copernicus Urban Atlas data 
- **Map previews & exploratory analysis**: produced in [QGIS](https://qgis.org/) — see `Docs/Images/`

Tiles for the map are generated from the NetAScore output via [Tippecanoe](https://github.com/felt/tippecanoe) into [PMTiles](https://github.com/protomaps/PMTiles), and rendered client-side with [MapLibre GL JS](https://maplibre.org/).


![Salzburg map preview](Docs/Images/salzburg-Maps-01.jpg)

## Features

- **Walkability & bikeability scoring** for every street segment, broken down into Safety, Comfort, and Joy indicators
- **Two case study cities**: Salzburg and Olomouc, with an interactive score slider and filtering by score tier
- **Points of interest** — schools, sports facilities, parks, and bus stops — toggleable on the map
- **Environmental layers** (Salzburg) — land use/land cover and street tree canopy, from Copernicus data
- **Location search** for finding and jumping to specific streets or places

## Tech Stack

- [MapLibre GL JS](https://maplibre.org/) for vector tile rendering
- [PMTiles](https://github.com/protomaps/PMTiles) for serving map tiles without a tile server
- [Chart.js](https://www.chartjs.org/) for score breakdown charts
- Vanilla HTML/CSS/JS 


## Credits

Developed by **Amna Azeem** © 2026

With support from:

- [Copernicus / MASTER CDE](https://master-cde.eu/)
- [Co-funded by the European Union](https://european-union.europa.eu/)
- [Mobility Lab](https://mobilitylab.zgis.at/en/home-2/) — University of Salzburg (PLUS)
- [Paris Lodron University Salzburg (PLUS)](https://www.plus.ac.at/)
- [Palacký University Olomouc (UP)](https://www.upol.cz)
- [i-MOBYL](https://https://www.i-mobyl.eu/)

**Connect:**
[LinkedIn](https://www.linkedin.com/in/amna-azeem/) · [GitHub](https://github.com/urbanistamna) · [Instagram](https://www.instagram.com/urbanistamna) · [X / Twitter](https://x.com/urbanistamna)
