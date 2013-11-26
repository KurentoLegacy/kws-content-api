/*
 * (C) Copyright 2013 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */
var url  = document.URL;
var path = myUrl.substring(0, myUrl.lastIndexOf("/") + 1);

var config =
{
  videoUrls:
  {
    test1: myPath+"playerJsonTunnel",
    test2: myPath+"playerJsonTunnel",
    test3: myPath+"playerJsonFilter",
    test4: myPath+"playerJsonEvents"
  },
  kwsContentUploader: myPath+"recorder-record-with-redirect"
};