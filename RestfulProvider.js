// For completeness.
Ext.Direct.RestfulEvent = Ext.extend(Ext.Direct.RemotingEvent, {
    type: 'rest'
});
Ext.Direct.eventTypes['restful'] = Ext.Direct.RestfulEvent;

Ext.direct.RestfulProvider = Ext.extend(Ext.direct.RemotingProvider, {

    /**
     * Defined actions corresponding to remote actions:
     * <pre><code>
     actions: {
     create  : 'create',  // Text representing the remote-action to create records on server.
     read    : 'read',    // Text representing the remote-action to read/load data from server.
     update  : 'update',  // Text representing the remote-action to update records on server.
     destroy : 'destroy'  // Text representing the remote-action to destroy records on server.
     }
     * </code></pre>
     * @property actions
     * @type Object
     */
    availableActions : {
        create  : 'create',
        read    : 'read',
        update  : 'update',
        destroy : 'destroy'
    },
    
    /**
     * Defined {CRUD action}:{HTTP method} pairs to associate HTTP methods with the
     * corresponding actions for {@link Ext.data.DataProxy#restful RESTful proxies}.
     * Defaults to:
     * <pre><code>
     restActions : {
     create  : 'POST',
     read    : 'GET',
     update  : 'PUT',
     destroy : 'DELETE'
     },
     * </code></pre>
     */
    restActions : {
        create  : 'POST',
        read    : 'GET',
        update  : 'PUT',
        destroy : 'DELETE'
    },
    
    // private
    initAPI : function(){
        var o = this.actions;
        for(var c in o){
            var cls = this.namespace[c] || (this.namespace[c] = {}),
            ms = o[c];
	    if (ms.restful) {
		this.createRestfulMethods(c, cls);
		if (ms.additionalActions) {
		    for(var i = 0, len = ms.additionalActions.length; i < len; i++){
			var m = ms.additionalActions[i];
			cls[m.name] = this.createMethod(c, m);
		    }   
		}
	    } else {
		for(var i = 0, len = ms.length; i < len; i++){
                    var m = ms[i];
                    cls[m.name] = this.createMethod(c, m);
		}
	    }
        }
    },

/* create, read, update, destroy */
    createRestfulMethods: function(c, cls) {
	cls['create'] = function(form,callback,scope) {
	    this.doForm(c, {
		'name': 'create',
		'formHandler': true,
		'baseURL': this.actions[c].baseURL,
		'len': 1 // 1st arg is object to create
	    },form,callback,scope);
	}.createDelegate(this);
	cls['read'] = function() {
	    this.doCall(c,{
		'name' : 'read',
		'baseURL': this.actions[c].baseURL,
		'len' : 0 // ID to read or nothing for all.
	    }, Array.prototype.slice.call(arguments, 0));
	}.createDelegate(this);
	cls['update'] = function(form,callback,scope) {
	    this.doForm(c, {
		'name': 'update',
		'formHandler': true,
		'baseURL': this.actions[c].baseURL,
		'len': 1 // 1st arg is object to create
	    },form,callback,scope);
	}.createDelegate(this);
	cls['delete'] = function() {
	    this.doCall(c,{
		'name' : 'delete',
		'baseURL': this.actions[c].baseURL,
		'len' : 1 // ID to delete
	    }, Array.prototype.slice.call(arguments, 0));
	}.createDelegate(this);

	return cls;
    },

    doCall : function(c, m, args){
        var data = null, hs = args[m.len], scope = args[m.len+1];

        if(m.len !== 0){
            data = args.slice(0, m.len);
        }

        var t = new Ext.Direct.Transaction({
            provider: this,
            args: args,
            action: c,
            method: m.name,
	    methodInfo: m,
            data: data,
            cb: scope && Ext.isFunction(hs) ? hs.createDelegate(scope) : hs
        });

        if(this.fireEvent('beforecall', this, t) !== false){
            Ext.Direct.addTransaction(t);
	    console.log("Queueing xaction: ",t);
            this.queueTransaction(t);
            this.fireEvent('call', this, t);
        }
    },


    doSend : function(data){
	console.log("Doing Send: %o", data);

	var url = data.methodInfo.baseURL || this.url;
	var method = data.methodInfo.method || this.restActions[data.method];
	
        var o = {
            url: url,
            callback: this.onData,
            scope: this,
            ts: data,
            timeout: this.timeout,
	    method: method
        }, callData;

        if(Ext.isArray(data)){
            callData = [];
            for(var i = 0, len = data.length; i < len; i++){
                callData.push(this.getCallData(data[i]));
            }
        }else{
            callData = this.getCallData(data);
        }

        if(this.enableUrlEncode || o.method == "GET"){
            var params = {};
            params[Ext.isString(this.enableUrlEncode) ? this.enableUrlEncode : 'data'] = Ext.encode(callData);
            o.params = params;
        }else{
            o.jsonData = callData;
        }
	console.log('requesting %o',o);
        Ext.Ajax.request(o);
    }    



});

Ext.Direct.PROVIDERS['restful'] = Ext.direct.RestfulProvider;