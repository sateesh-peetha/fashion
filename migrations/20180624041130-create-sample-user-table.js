'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  db.createTable('sample_user', {
    id: {
    	type: 'int',
        unsigned: true,
        notNull: true,
        primaryKey: true,
        autoIncrement: true,
        length: 10
    },
    username: {
    	type: 'string',
    	length: 30,
    	notNull: true,
    	unique: true
    },
    password: {
      type: 'string',
      length: 30,
      notNull: false,
      unique: false
    }
  }, function() {console.log("sample_user table created")});
  return null;
};

exports.down = function(db) {
  db.dropTable('sample_user');
  return null;
};

exports._meta = {
  "version": 1
};