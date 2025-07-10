class Orden:
    def __init__(self, cliente, tipo, marca, modelo,
             estado_entrada, perifericos, observaciones,
             total_servicio):
        self.cliente = cliente
        self.tipo = tipo
        self.marca = marca
        self.modelo = modelo
        self.estado_entrada = estado_entrada
        self.perifericos = perifericos
        self.observaciones = observaciones 
        self.total_servicio = total_servicio



    def a_dict(self):
        return self.__dict__
