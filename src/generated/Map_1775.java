package de.fuberlin.wiwi.inf.csw.beast.generated;

import org.oscim.core.MapPosition;
import org.oscim.layers.tile.buildings.BuildingLayer;
import org.oscim.layers.tile.vector.label.LabelLayer;
import org.oscim.layers.tile.vector.osm.OsmTileLayer;
import org.oscim.map.Map;
import org.oscim.view.CanvasView;

public class Map_1775 implements de.fuberlin.wiwi.inf.csw.beast.api.InternalEventHandler {

    private final Map mMap_1775 = new Map();
    private final BuildingLayer mBuildingLayer_1776 = new BuildingLayer(mMap_1775, new org.oscim.theme.InternalRenderTheme(org.oscim.theme.InternalRenderTheme.ThemeFile.DEFAULT));
    private final LabelLayer mLabelLayer_1777 = new LabelLayer(mMap_1775, mBuildingLayer_1776);
    private final OsmTileLayer mTileLayer_1778 = new OsmTileLayer(mMap_1775);

    public Map_1775() {
        mMap_1775.layers().add(mTileLayer_1778);
        mMap_1775.layers().add(mBuildingLayer_1776);
        mMap_1775.layers().add(mLabelLayer_1777);
    }

    public void setMap_1775_MapPosition(MapPosition value_1779) {
        mMap_1775.setMapPosition(value_1779);
    }

    public void setMap_1775_LabelsEnabled(boolean value_1780) {
        mMap_1775.setLabelsEnabled(value_1780);
    }

    public void setMap_1775_MapEventLayer(org.oscim.layers.Layer value_1781) {
        mMap_1775.setMapEventLayer(value_1781);
    }

    public Map getMap_1775_Map() {
        return mMap_1775;
    }

    private CanvasView mCanvasView_1785;
    public void setCanvasView_1785_CanvasView(CanvasView value_1786) {
        mCanvasView_1785 = value_1786;
        if (mCanvasView_1785 != null) {
            mCanvasView_1785.setMap(mMap_1775);
        }
    }

    @Override
    public Boolean handleEvent(final de.fuberlin.wiwi.inf.csw.beast.api.InternalEvent event) {
        return true;
    }

    @Override
    public Object getValue(String path) {
        if ("map_1775.mapPosition".equals(path)) {
            return mMap_1775.getMapPosition();
        }
        if ("map_1775.labelsEnabled".equals(path)) {
            return mMap_1775.getLabelsEnabled();
        }
        if ("map_1775.mapEventLayer".equals(path)) {
            return mMap_1775.getMapEventLayer();
        }
        if ("map_1775.map".equals(path)) {
            return mMap_1775;
        }
        return null;
    }

}
