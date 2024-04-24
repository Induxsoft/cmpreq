var cc =
{
    url_exit:"", formId:"", form:null,
    cots_length:0,
    prod_length:0,

    init()
    {
        const btn_submit = document.getElementById("btn_submit");
        this.form = document.getElementById(this.formId);

        btn_submit.addEventListener("click", () => this.submit());

        this.setKeyboardShortcuts();
        this.asignar();
    },

    setKeyboardShortcuts()
    {
        document.addEventListener("keydown", (e) => {
            // console.log("key: "+ e.key + " | " + "code: " + e.code);
            if (e.key === "Escape") {
                e.preventDefault();
                (this.url_exit !== "")
                    ? window.location.href = this.url_exit
                    : window.open("/","_top"); 
            }
            if (e.key === "F5") {
                e.preventDefault();
                window.location.reload();
            }
        });
    },

    submit()
    {
        if (!this.form) return;
        let continuar = true;

        for (let row = 1; row <= this.prod_length; row++) {
            const desierto = document.getElementById(`rd_${row}_0`);
            if (desierto.checked) {
                if (confirm("¡Pedido incompleto!\r\n¿Desea continuar?")) {
                    continuar = true;
                    break;
                } else {
                    continuar = false;
                    break;
                }
            }
        }

        if (!continuar) return;
        this.form.submit();
    },

    asignar()
    {
        const td_ttl_pedido = document.getElementById("td_ttl_pedido");
        let ttl_pedido = 0;

        for (let prov = 1; prov <= this.cots_length; prov++) {
            const td_ttl_prov = document.getElementById(`td_ttl_${prov}`)
            let ttl_prov = 0;

            for (let prod = 1; prod <= this.prod_length; prod++) {
                const radio = document.getElementById(`rd_${prod}_${prov}`);

                if (radio.checked)
                {
                    const td = document.getElementById(`td_ttl_${prod}_${prov}`);
                    let value = Number(td.getAttribute("data-value"));
                    ttl_prov = Math.add(ttl_prov,value);
                }
            }
            
            td_ttl_prov.textContent = ttl_prov;
            ttl_pedido = Math.add(ttl_pedido,ttl_prov);
        }

        td_ttl_pedido.textContent = ttl_pedido;
    },
}