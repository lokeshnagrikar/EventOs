-- Add category and favorite columns to gallery_items
ALTER TABLE gallery_items ADD COLUMN category VARCHAR(255);
ALTER TABLE gallery_items ADD COLUMN favorite BOOLEAN DEFAULT FALSE NOT NULL;

-- Create gallery_item_tags table for tags (ElementCollection)
CREATE TABLE gallery_item_tags (
    gallery_item_id UUID NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    PRIMARY KEY (gallery_item_id, tag)
);

-- Indexes for performance
CREATE INDEX IDX_gallery_items_category ON gallery_items(category);
CREATE INDEX IDX_gallery_items_favorite ON gallery_items(favorite);
CREATE INDEX IDX_gallery_item_tags_tag ON gallery_item_tags(tag);
