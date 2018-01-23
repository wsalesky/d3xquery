d3sparql.js
===========
A d3js library for interacting with TEI relationships and building dynamic d3js visualizations. Created for Syriaca.org [http://syriaca.org/]. Tested in eXist v3.5 ->

The library queries tei:relation elements and returns the results to the javascript for graphing. You can run a query to return all relationships 
(Bar Charts, Pie Charts and Bubble graphs work best with this kind of data.) These charts run an overview and group relationships by type of relationship, as specified in the ref attribute. 

You can also submit a record id and get realtionships with that record id as specified in the @active, @passive and @mutual attributes
Javascript library is a branch of https://github.com/ktym/d3sparql with modifications and additions. 

Syriaca.org data can be used as examples: [https://github.com/srophe/srophe-app-data]


### Currently supports
* Charts
  * barchart, piechart, scatterplot*
* Graphs
  * force graph, sankey graph
* Trees
  * roundtree*, dendrogram*, treemap*, sunburst*, circlepack*, bubble
* Maps
  * coordmap*, namedmap*
* Tables
  * htmltable, htmlhash*
  
  *Javascript code exists for these but they have not yet been adapted to the XQuery results. 
  
### Usage
 
Add folders to an eXist application, change the 
<input type="hidden" name="format" id="collection" value="/db/apps/srophe-data/data/spear"/> in index.html to point to your data collection.

Run queries. 
 