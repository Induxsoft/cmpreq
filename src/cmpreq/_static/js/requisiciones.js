var requisiciones =
{
    list: {
        tableId:"",
        table:null,

        init()
        {
            this.table = document.getElementById(this.tableId);

            this.setKeyboardShortcuts();
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },

        getCurrentContext()
        {
            const id = (this.table?.DataArray[this.table.CurrentRowIndex()]?.sys_pk ?? "");
            return { item_id:id, context: {} }
        },
    },

    form: {
        url_get_fultimo:"", url_get_linea:"",

        init()
        {
            const sel_ejercicio = document.getElementById("sel_ejercicio");
            const ik_partida_pre = document.getElementById("ik_partida_pre");
            const btn_get_folio = document.getElementById("btn_get_folio");
            const sel_divisa = document.getElementById("sel_divisa");
            const fil_clase = document.getElementById("fil_clase");

            if (sel_ejercicio) sel_ejercicio.addEventListener("change", () => { ik_partida_pre.clear() });
            if (ik_partida_pre) ik_partida_pre.onBeforeSearch = (url) => { return this.prepareIkPartida(url) }
            if (btn_get_folio) btn_get_folio.addEventListener("click", () => { this.getFolio() });
            if (sel_divisa) sel_divisa.addEventListener("change", (event) => { this.setTipoCambio(event.target) });
            if (fil_clase) fil_clase.addEventListener("change", (event) => {
                let params = {iclase:event.target.value}
                let first_object = {sys_pk: -1, descripcion: "(Todas las lineas)"}
                this.fillSelect("fil_linea","sys_pk","descripcion",this.url_get_linea,params,first_object);
            });

            this.setKeyboardShortcuts();

            trigger(sel_divisa,"change");
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },

        prepareIkPartida(url)
        {
            const ik_unidad_org = document.getElementById("ik_unidad_org");
            const sel_ejercicio = document.getElementById("sel_ejercicio");

            let unidad = ik_unidad_org.getValue();
            let ejercicio = sel_ejercicio.value;

            let endpoint = url + "&iunidad="+unidad.sys_pk + "&ejercicio="+ejercicio;

            return endpoint;
        },

        getFolio()
        {
            const sel_serie = document.getElementById("sel_serie");
            const opt_serie = sel_serie.options[sel_serie.selectedIndex];
            const txt_folio = document.getElementById("txt_folio");
            
            let iblock = Number(opt_serie.getAttribute("data-iblock"));
            let url = this.url_get_fultimo.replace("{iblock}",iblock);

            if (Number(txt_folio.value) > 0) return;

            fetch(url).then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                }

                txt_folio.value = data.fultimo;
            })
            .catch(error => console.error(error));
        },

        setTipoCambio(selDivisa)
        {
            const opt_divisa = selDivisa.options[selDivisa.selectedIndex];
            const txt_tcambio = document.getElementById("txt_tcambio");
            
            txt_tcambio.value = Number(opt_divisa.getAttribute("data-tcambio") ?? "1");
        },

        fillSelect(id, kf, vf, url, params={}, fo={})
        {
            const select = document.getElementById(id);

            let endpoint = InduxsoftCrudlModel.UrlReplace(url,params);
            let selected = select.value ?? "";

            fetch(endpoint).then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                }
                
                select.innerHTML = "";

                if (Object.keys(fo).length >= 2) data.unshift(fo);

                data.forEach(obj => {
                    const option = document.createElement("option");
                    option.value = obj[kf];
                    option.text = obj[vf];
                    if (obj[kf] === selected) option.selected = true;

                    select.appendChild(option);
                });
            })
            .catch(error => console.error(error));
        },
    },

    edit: {
        formId:"", form:null,
        tableId:"", table:null,
        divAlerts:"", lastUnit:"", url_change_status:"", url_solcot:"",

        init()
        {
            const btn_submit = document.getElementById("btn_submit");
            const ik_producto = document.getElementById("ik_producto");
            const btn_add_row = document.getElementById("btn-add-row");
            const btn_del_row = document.getElementById("btn-del-row");
            this.form = document.getElementById(this.formId);
            this.table = document.getElementById(this.tableId);

            if (btn_submit) btn_submit.addEventListener("click", () => { this.save() });
            ik_producto.addEventListener("change",(data) => { this.agregarProducto(data) });
            btn_add_row.addEventListener("click", () => { this.table.AddRow() });
            btn_del_row.addEventListener("click", () => 
            { 
                this.table.DeleteCurrentRow();
                requisiciones.edit.sumarTotales();
            });

            this.table.setInputKey("codigo",ik_producto);
            this.table.setInputKey("descripcion",ik_producto);
            this.setKeyboardShortcuts();
            this.setEventBtnStatus();
            this.setEventTable();
            this.sumarTotales();
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },

        setEventTable()
        {
            if (!this.table) return;

            let tbl = this.table;
            const evt = tbl.EdiTable.Const.Events;

            tbl.Events[evt.StartEdition] = (e) => { this.fillUnitCell(e) };
            tbl.Events[evt.BeforeUpdateCell] = (e) => { this.validateRowCells(e) };
            tbl.Events[evt.ConfirmEdition] = (e) => { this.calculateAmounts(e) };
        },

        setEventBtnStatus()
        {
            const buttons = document.querySelectorAll(".btn-status");
            buttons.forEach(btn => {
                let status = Number(btn.getAttribute("data-status"));
                btn.addEventListener("click", () => { this.changeStatus(status) });
            });
        },

        save()
        {
            if (!this.form.reportValidity()) return;

            const txt_detalle = document.getElementById("txt_detalle");
            let _detalle = (this.table?.DataArray??[]).filter((prod) => { return Object.entries(prod??{}).length >= 9 });

            txt_detalle.value = JSON.stringify(_detalle);

            trigger(this.form,"submit");
        },

        changeStatus(status)
        {
            if (!this.url_change_status) return;
            const txt_detalle = document.getElementById("txt_detalle");
            let _detalle = (this.table?.DataArray??[]).filter((prod) => { return Object.entries(prod??{}).length >= 9 });
            
            if(_detalle.length<1 && status==10)
            {
                alert("Debe agregar productos en la tabla.");
                return;
            }
            if(status==10)txt_detalle.value = JSON.stringify(_detalle);
            
            let fd = new FormData(this.form);
            fd.append("status",status);
            let endpoint = this.url_change_status.replace("{ireq}",fd.get("sys_pk"));

            const onSuccess = (data) =>
            {
                if (data.message) {
                    alert(data.message);
                    return;
                }

                if (data.status === 20 && this.url_solcot) window.location.href = path_concat(this.url_solcot, data.sys_pk, "/cmp-in-process/");
                else window.location.reload();
            }
            const onFailure = (error) => { alert(error.message ?? JSON.stringify(error)) }

            InduxsoftCrudlModel.InvokeService(endpoint,fd,onSuccess,onFailure,"PATCH",false,true,"",true);
        },

        agregarProducto(p)
        {
            if (!p) return;

            let tData = this.table.DataArray ?? [];
            let curr_row = this.table.CurrentRowIndex();
            let i = this.calcularImpuestos(p);
            let lu = this.joinUnidades(p.unidada,p.unidadb,p.unidadc,p.unidadd,p.unidade);
            
            let producto = 
            {
                // campos visibles en el editable.
                codigo: p.codigo,
                descripcion: p.descripcion,
                unidad: p.unidada,
                precio: i.costo,
                cantidad: i.cantidad,
                subtotal: i.subtotal,
                descuentos: i.descuentos,
                impuestos: i.impuestos,
                importe: i.total,
                notas: "",

                // campos para el insert.
                producto: p.sys_pk,
                costototal: i.costo,
                descuento1: i.descuentos,
                descuento2: 0,
                factor: 1,
                impuesto1: i.impuesto1,
                impuesto2: i.impuesto2,
                impuesto3: i.impuesto3,
                impuesto4: i.impuesto4,

                // campos extras para operaciones.
                i1_tasa: p.i1_tasa,
                i2_tasa: p.i2_tasa,
                i3_tasa: p.i3_tasa,
                i4_tasa: p.i4_tasa,
                unidada: p.unidada,
                unidadb: p.unidadb,
                unidadc: p.unidadc,
                unidadd: p.unidadd,
                unidade: p.unidade,
                factorb: p.factorb,
                factorc: p.factorc,
                factord: p.factord,
                factore: p.factore,
                list_unidades: lu
            }

            if (curr_row < 0) curr_row = 0;
            if (!tData[curr_row]) tData[curr_row] = {};
            tData[curr_row] = producto
            this.table.UpdateRow(curr_row);
            this.table.NavTo(curr_row,2);
            this.sumarTotales();
        },

        actualizarProducto(producto, rowIndex) {
            let i = this.calcularImpuestos(producto);
    
            producto["precio"] = i.costo;
            producto["cantidad"] = i.cantidad;
            producto["subtotal"] = i.subtotal;
            producto["descuentos"] = i.descuentos;
            producto["impuestos"] = i.impuestos;
            producto["importe"] = i.total;
            producto["costototal"] = i.costo;
            producto["descuento1"] = i.descuentos;
            producto["impuesto1"] = i.impuesto1;
            producto["impuesto2"] = i.impuesto2;
            producto["impuesto3"] = i.impuesto3;
            producto["impuesto4"] = i.impuesto4;
    
            this.table.UpdateRow(rowIndex);
            this.sumarTotales();
        },

        joinUnidades(...unidades) {
            let obj = {};
    
            for (let i = 0; i < unidades.length; i++) {
                const u = unidades[i];
                if (typeof u === "string" && u.trim() != "")
                    obj[u] = u;
            }
    
            return JSON.stringify(obj);
        },

        calcularImpuestos(prod)
        {
            let costo = Number(prod.precio);
            let cantidad = Number(prod.cantidad);
            let descuentos = Number(prod.descuentos);
            let i1_tasa = Number(prod.i1_tasa);
            let i2_tasa = Number(prod.i2_tasa);
            let i3_tasa = Number(prod.i3_tasa);
            let i4_tasa = Number(prod.i4_tasa);
    
            let subtotal = Math.mul(costo,cantidad);
            let sub_desc = Math.sub(subtotal,descuentos);
            let impuesto1 = Math.mul(sub_desc,i1_tasa);
            let impuesto2 = Math.mul(sub_desc,i2_tasa);
            let i1_i2 = Math.add(impuesto1,impuesto2);
            let sub_desc_i1_i2 = Math.add(sub_desc,i1_i2);
            let impuesto3 = Math.mul(sub_desc_i1_i2,i3_tasa);
            let impuesto4 = Math.mul(sub_desc_i1_i2,i4_tasa);
            let i3_i4 = Math.add(impuesto3,impuesto4);
            let impuestos = Math.add(i1_i2,i3_i4);
            let total = Math.add(sub_desc,impuestos);
    
            let importes =
            {
                costo: costo,
                cantidad: cantidad,
                subtotal: subtotal,
                descuentos: descuentos,
                impuestos: impuestos,
                total: total,
                impuesto1: impuesto1,
                impuesto2: impuesto2,
                impuesto3: impuesto3,
                impuesto4: impuesto4,
            }
    
            return importes;
        },

        sumarTotales()
        {
            if (!this.table) return;

            const lbl_subtotal = document.getElementById("lbl_subtotal");
            const lbl_impuesto = document.getElementById("lbl_impuesto");
            const lbl_importe = document.getElementById("lbl_importe");
            const txt_divisa = document.getElementById("txt_divisa");

            let lcode = (new Intl.NumberFormat()).resolvedOptions().locale;
            let divisa = txt_divisa.getAttribute("data-codigo").toUpperCase();
            let tData = this.table?.DataArray ?? [];
    
            let subtotal = 0, descuento = 0, impuesto = 0, importe = 0;
    
            for (let i = 0; i < tData.length; i++) {
                const producto = tData[i];
                if (Object.entries(producto ?? {}).length < 9) continue;
                
                subtotal += Number(producto.subtotal);
                descuento += Number(producto.descuentos);
                impuesto += Number(producto.impuestos);
                importe += Number(producto.importe);
            }

            const formatter = new Intl.NumberFormat(lcode,{
                style: "currency",
                currency: divisa,
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
            });
    
            lbl_subtotal.textContent = formatter.format(subtotal);
            lbl_impuesto.textContent = formatter.format(impuesto);
            lbl_importe.textContent = formatter.format(importe);
        },

        fillUnitCell(e)
        {
            let coldef = e.sender.GetColumnDefOfTd(e.td);
            let curr_row = this.table.CurrentRowIndex();
            let producto = this.table?.DataArray[curr_row] ?? {};

            if (Object.entries(producto ?? {}).length < 9) return;
            if (coldef.field !== "unidad") return;

            if (!producto.list_unidades) {
                producto["list_unidades"] = this.joinUnidades(producto.unidada,producto.unidadb,producto.unidadc,producto.unidadd,producto.unidade);
            }
            coldef.options = JSON.parse(producto.list_unidades);
        },

        validateRowCells(e)
        {
            let curr_row = e.sender.RowIndexOfTd(e.td);
            let field = e.coldef.field;
            let producto = this.table?.DataArray[curr_row] ?? {};

            if (Object.entries(producto ?? {}).length < 9) return;

            if (field === "unidad" && e.text.trim() === "") {
                show_alert(this.divAlerts,"Debe elegir la unidad.",3);
                e.cancel = true;
                return false;
            }
            if ((field === "precio" || field === "cantidad") && Number(e.text.trim()) <= 0) {
                show_alert(this.divAlerts,"El valor debe ser mayor que 0.",3);
                e.cancel = true;
                return false;
            }
        },

        calculateAmountsXUnits(e)
        {
            let curr_row = e.sender.RowIndexOfTd(e.td);
            let producto = this.table?.DataArray[curr_row] ?? {};

            if (Object.entries(producto ?? {}).length < 9) return;
            if (e.coldef.field !== "unidad") return;
            
            this.lastUnit = producto.unidad;
            producto["unidad"] = e.text;

            switch (e.text) {
                case producto.unidada:
                    if (this.lastUnit == producto.unidada) return;

                    let precioA = 0;
                    if (this.lastUnit == producto.unidadb) precioA = Math.div(producto.precio,producto.factorb);
                    else if (this.lastUnit == producto.unidadc) precioA = Math.div(producto.precio,producto.factorc);
                    else if (this.lastUnit == producto.unidadd) precioA = Math.div(producto.precio,producto.factord);
                    else if (this.lastUnit == producto.unidade) precioA = Math.div(producto.precio,producto.factore);
                    
                    producto["precio"] = precioA;
                    producto["factor"] = 1; // factora
                    this.lastUnit = producto.unidada;

                    this.actualizarProducto(producto,curr_row);
                    break;
                case producto.unidadb:
                    if (this.lastUnit == producto.unidadb) return;

                    let precioB = 0;
                    if (this.lastUnit == producto.unidada) precioB = Math.mul(producto.precio,producto.factorb);
                    else if (this.lastUnit == producto.unidadc) {
                        let x = Math.mul(producto.factorb,producto.precio);
                        precioB = Math.div(x,producto.factorc);
                    }
                    else if (this.lastUnit == producto.unidadd) {
                        let x = Math.mul(producto.factorb,producto.precio);
                        precioB = Math.div(x,producto.factord);
                    }
                    else if (this.lastUnit == producto.unidade) {
                        let x = Math.mul(producto.factorb,producto.precio);
                        precioB = Math.div(x,producto.factore);
                    }

                    producto["precio"] = precioB;
                    producto["factor"] = producto.factorb;
                    this.lastUnit = producto.unidadb;

                    this.actualizarProducto(producto,curr_row);
                    break;
                case producto.unidadc:
                    if (this.lastUnit == producto.unidadc) return;
                    
                    let precioC = 0;
                    if (this.lastUnit == producto.unidada) precioC = Math.mul(producto.precio,producto.factorc);
                    else if (this.lastUnit == producto.unidadb) {
                        let x = Math.mul(producto.factorc,producto.precio);
                        precioC = Math.div(x,producto.factorb);
                    }
                    else if (this.lastUnit == producto.unidadd) {
                        let x = Math.mul(producto.factorc,producto.precio);
                        precioC = Math.div(x,producto.factord);
                    }
                    else if (this.lastUnit == producto.unidade) {
                        let x = Math.mul(producto.factorc,producto.precio);
                        precioC = Math.div(x,producto.factore);
                    }

                    producto["precio"] = precioC;
                    producto["factor"] = producto.factorc;
                    this.lastUnit = producto.unidadc;

                    this.actualizarProducto(producto,curr_row);
                    break;
                case producto.unidadd:
                    if (this.lastUnit == producto.unidadd) return;
                    
                    let precioD = 0;
                    if (this.lastUnit == producto.unidada) precioD = Math.mul(producto.precio,producto.factord);
                    else if (this.lastUnit == producto.unidadb) {
                        let x = Math.mul(producto.factord,producto.precio);
                        precioD = Math.div(x,producto.factorb);
                    }
                    else if (this.lastUnit == producto.unidadc) {
                        let x = Math.mul(producto.factord,producto.precio);
                        precioD = Math.div(x,producto.factorc);
                    }
                    else if (this.lastUnit == producto.unidade) {
                        let x = Math.mul(producto.factord,producto.precio);
                        precioD = Math.div(x,producto.factore);
                    }
                    
                    producto["precio"] = precioD;
                    producto["factor"] = producto.factord;
                    this.lastUnit = producto.unidadd;

                    this.actualizarProducto(producto,curr_row);
                    break;
                case producto.unidade:
                    if (this.lastUnit == producto.unidade) return;
                    
                    let precioE = 0;
                    if (this.lastUnit == producto.unidada) precioE = Math.mul(producto.precio,producto.factore);
                    else if (this.lastUnit == producto.unidadb) {
                        let x = Math.mul(producto.factore,producto.precio);
                        precioE = Math.div(x,producto.factorb);
                    }
                    else if (this.lastUnit == producto.unidadc) {
                        let x = Math.mul(producto.factore,producto.precio);
                        precioE = Math.div(x,producto.factorc);
                    }
                    else if (this.lastUnit == producto.unidadd) {
                        let x = Math.mul(producto.factore,producto.precio);
                        precioE = Math.div(x,producto.factord);
                    }

                    producto["precio"] = precioE;
                    producto["factor"] = producto.factore;
                    this.lastUnit = producto.unidade;

                    this.actualizarProducto(producto,curr_row);
                    break;

                default:
                    show_alert(this.divAlerts,"Unidad: " + e.text + " no se encuentra en el diccionario.", 3);
                    break;
            }
        },

        calculateAmounts(e)
        {
            let curr_row = e.sender.RowIndexOfTd(e.td);
            let field = e.coldef.field;
            let producto = this.table?.DataArray[curr_row] ?? {};

            if (Object.entries(producto ?? {}).length < 9) return;
            if (!["unidad","precio","cantidad"].includes(field)) return;

            if (field === "unidad") {
                this.calculateAmountsXUnits(e);
                return;
            }

            if (field === "precio") producto["precio"] = Number(e.text.trim());
            if (field === "cantidad") producto["cantidad"] = Number(e.text.trim());
            
            this.actualizarProducto(producto,curr_row);
        },
    }
}