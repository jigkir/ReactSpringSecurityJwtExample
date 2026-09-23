package com.lacouf.rsbjwt.util;

import org.h2.tools.Server;
import java.sql.SQLException;

public class TcpServer {
    public static void createTcpServer(int port, String dataBase) throws SQLException {
        Server tcpServer = Server.createTcpServer("-tcp", "-tcpAllowOthers", "-tcpPort", Integer.toString(port));
        IO.println("Tcp server start: " + tcpServer.start());
        IO.println(tcpServer.getStatus() + " " + tcpServer.getPort());
        IO.println("jdbc:h2:tcp://localhost:" + port + "/mem:" + dataBase);
    }
}
