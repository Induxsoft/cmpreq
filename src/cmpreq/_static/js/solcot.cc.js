var cc =
{
    url_exit:"",
    cots_length:0,
    prod_length:0,

    init()
    {
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

            ttl_pedido = Math.add(ttl_pedido,ttl_prov);
            td_ttl_prov.textContent = ttl_prov;
        }

        td_ttl_pedido.textContent = ttl_pedido;
    },
}