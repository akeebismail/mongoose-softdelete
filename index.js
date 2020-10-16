const mongoose = require('mongoose')

/**
 *  Remove all deleted documents from the results
 * @type {function(*=, *=): *}
 */
const exec = mongoose.Query.prototype.exec;
mongoose.Query.prototype.exec = function () {
    if (!this.withTrashed) {
        this.merge({deletedAt: null})
    }
    console.log('the query', this.getQuery())
    return exec.apply(this, arguments)
}
/**
 *
 * Override all mongoose delete functions to implement soft deletes
 **/
mongoose.Query.prototype.deleteOne = function (condition) {
    return this.softDelete(condition)
}
mongoose.Query.prototype.deleteMany = function (filter, options, callback) {
    return this.softDeleteMany(filter, options, callback);
}
mongoose.Query.prototype.findOneAndDelete = function (condition, options, callback) {
    return this.softDelete(condition, options, callback)
}
mongoose.Query.prototype.findOneAndRemove = function (conditions, options, callabck) {
    return this.softDelete(conditions, options, callabck)
}

mongoose.Query.prototype.softDelete = function (condition, options, callback) {
    return this.findOneAndUpdate(condition, {deletedAt: new Date()}, options, callback)
}
mongoose.Query.prototype.softDeleteMany = function (conditions, option, callback) {
    return this.updateMany(conditions, {deletedAt: new Date()}, option, callback)
}

mongoose.Query.prototype.restoreOne = function (condition, option, callback) {
    return this.findOneAndUpdate(condition, {deletedAt: null}, option, callback)
}
mongoose.Query.prototype.restoreMany = function (conditions, options, callback) {
    return this.updateMany(conditions, {deleteAt: null}, options, callback);
}
mongoose.Query.prototype.forceDelete = function (condition, options, callback) {
    return this.deleteMany(condition, options, callback)
}
mongoose.Query.prototype.onlyTrashed = function (condition, options, callback) {
    this.merge({deleteAt: {$ne: null}})
    return this.find(condition, options, callback);
}
/**
 * get documents with deleted documents
 *  Model.find().withTrashed().exec()
 * @returns {mongoose.Query}
 */
mongoose.Query.prototype.withTrashed = function () {
    //this.merge({deletedAt: {$ne: null}})
    this.withTrashed = true
    return this
}

mongoose.Query.prototype.isTrashed = function (filter, options, callback) {
    return this.find(filter).lean().exec().then((doc, err) => {
        return doc && doc.deleteAt !== null
    })
}